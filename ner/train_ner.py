"""
Training script for multilingual spaCy NER e-Bill slot extractor.
Trains a blank multilingual ('xx') model on CPU using train.spacy and dev.spacy.
Saves best model to ./ner_model/ based on dev set F1 score.
Evaluates per-label F1 metrics and runs a hand-written 12-sentence smoke test.
"""

import os
import random
import spacy
from spacy.tokens import DocBin
from spacy.training import Example
from spacy.scorer import Scorer

def load_examples(spacy_file, nlp):
    doc_bin = DocBin().from_disk(spacy_file)
    docs = list(doc_bin.get_docs(nlp.vocab))
    examples = []
    for doc in docs:
        gold_dict = {
            "entities": [(ent.start_char, ent.end_char, ent.label_) for ent in doc.ents]
        }
        pred_doc = nlp.make_doc(doc.text)
        examples.append(Example.from_dict(pred_doc, gold_dict))
    return examples

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    train_path = os.path.join(base_dir, "train.spacy")
    dev_path = os.path.join(base_dir, "dev.spacy")
    model_output_dir = os.path.join(base_dir, "ner_model")

    if not os.path.exists(train_path) or not os.path.exists(dev_path):
        raise FileNotFoundError(f"Missing train.spacy or dev.spacy in {base_dir}. Run data_generator.py first.")

    print("Initializing blank multilingual ('xx') spaCy pipeline...")
    nlp = spacy.blank("xx")

    # Add NER pipe
    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner", last=True)
    else:
        ner = nlp.get_pipe("ner")

    LABELS = ["CUSTOMER_NAME", "PHONE", "PRODUCT", "QTY", "PRICE", "DISCOUNT"]
    for label in LABELS:
        ner.add_label(label)

    print("Loading train and dev dataset...")
    train_examples = load_examples(train_path, nlp)
    dev_examples = load_examples(dev_path, nlp)
    print(f"Loaded {len(train_examples)} train examples, {len(dev_examples)} dev examples.")

    print("Initializing optimizer...")
    optimizer = nlp.initialize(lambda: train_examples)

    EPOCHS = 18
    BATCH_SIZE = 32
    PATIENCE = 5
    best_f1 = 0.0
    patience_counter = 0

    print(f"\nStarting CPU training loop ({EPOCHS} max epochs, batch size={BATCH_SIZE}, patience={PATIENCE})...\n")
    print(f"{'Epoch':<8} {'Loss':<12} {'Dev Prec':<12} {'Dev Rec':<12} {'Dev F1':<12} {'Status'}")
    print("-" * 65)

    for epoch in range(1, EPOCHS + 1):
        losses = {}
        random.shuffle(train_examples)
        batches = spacy.util.minibatch(train_examples, size=BATCH_SIZE)

        for batch in batches:
            nlp.update(batch, drop=0.2, sgd=optimizer, losses=losses)

        # Evaluate on dev set
        dev_pred_examples = []
        for eg in dev_examples:
            pred_doc = nlp(eg.reference.text)
            dev_pred_examples.append(Example(pred_doc, eg.reference))

        scores = Scorer().score(dev_pred_examples)
        dev_f1 = scores.get("ents_f", 0.0)
        dev_p = scores.get("ents_p", 0.0)
        dev_r = scores.get("ents_r", 0.0)
        loss_val = losses.get("ner", 0.0)

        status_msg = ""
        if dev_f1 > best_f1:
            best_f1 = dev_f1
            patience_counter = 0
            nlp.to_disk(model_output_dir)
            status_msg = "★ (Saved best)"
        else:
            patience_counter += 1
            status_msg = f"(no improvement {patience_counter}/{PATIENCE})"

        print(f"{epoch:<8} {loss_val:<12.2f} {dev_p:<12.4f} {dev_r:<12.4f} {dev_f1:<12.4f} {status_msg}")

        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping triggered after {epoch} epochs.")
            break

    print(f"\nTraining completed! Best Dev F1: {best_f1:.4f}. Model saved to {model_output_dir}")

    # Detailed Evaluation on Best Model
    print("\n" + "=" * 65)
    print("DETAILED PER-LABEL EVALUATION ON DEV SET")
    print("=" * 65)
    best_nlp = spacy.load(model_output_dir)

    eval_examples = []
    for eg in dev_examples:
        pred_doc = best_nlp(eg.reference.text)
        eval_examples.append(Example(pred_doc, eg.reference))

    detailed_scores = Scorer().score(eval_examples)
    per_type = detailed_scores.get("ents_per_type", {})

    print(f"{'Entity Label':<18} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Risk Note'}")
    print("-" * 65)
    for label in LABELS:
        stats = per_type.get(label, {"p": 0.0, "r": 0.0, "f": 0.0})
        risk_note = ""
        if label in ["QTY", "PRICE", "DISCOUNT"]:
            risk_note = "⚡ Money-critical field"
        print(f"{label:<18} {stats['p']:<12.4f} {stats['r']:<12.4f} {stats['f']:<12.4f} {risk_note}")
    print("=" * 65)

    # Smoke Test: 12 Hand-written sentences covering real-world phrasing
    print("\n" + "=" * 65)
    print("MANUAL SMOKE-TEST (12 Realistic Hand-Written Sentences)")
    print("=" * 65)

    smoke_tests = [
        # 1. Positional anchor-free
        "rahul 5565428785 oak wood planks",
        # 2. Full positional with numbers
        "rahul 5565428785 oak wood planks 2 4500",
        # 3. Anchored English
        "Customer John Doe, phone 9876543210, add 2 Teak Desk price 4500 discount 10%",
        # 4. Anchored Hindi Devanagari
        "ग्राहक राहुल शर्मा फ़ोन 9812345678 दो टीक डेस्क कीमत 5000 छूट 5%",
        # 5. Hinglish mixed phrasing
        "Aman ka bill banao 9811223344 do pieces Teak Desk rate 6000",
        # 6. Inverted order positional
        "dining table 4500 1 nimesh 9988776655",
        # 7. Pure Devanagari positional
        "विक्रम 9876543299 ओक वुड 2 4500",
        # 8. Short phone + product only
        "9823456789 conference table",
        # 9. Conversational request
        "please add 5 Ergonomic Office Chair at 3200 for client Neha Desai phone 9123456780",
        # 10. Word numbers in English
        "add five Teak Desk at two thousand rupees for Rohit phone 9845012345",
        # 11. Word numbers in Hindi
        "तीन कुर्सी कीमत बारह सौ ग्राहक दीपक फ़ोन 9876501234",
        # 12. Edge case: punctuation and extra spaces
        "name: Pooja Patel , phone: 9765432100 , product: Wooden Bookshelf , qty: 4 , price: 8500"
    ]

    for idx, test_text in enumerate(smoke_tests, 1):
        doc = best_nlp(test_text)
        ent_str = ", ".join([f"[{ent.text} -> {ent.label_}]" for ent in doc.ents]) or "(No entities)"
        print(f"\n[{idx:02d}] Input : \"{test_text}\"")
        print(f"     Output: {ent_str}")

    print("\n" + "=" * 65 + "\n")

if __name__ == "__main__":
    main()
