"""
Synthetic Training Data Generator for spaCy NER e-Bill Slot Extractor
Entities: CUSTOMER_NAME, PHONE, PRODUCT, QTY, PRICE, DISCOUNT
Styles:
  1. Anchored English (40%)
  2. Anchored Hindi / Hinglish (30%)
  3. Positional / Anchor-free (30%)
Outputs: train.spacy (85%), dev.spacy (15%)
"""

import os
import random
import spacy
from spacy.tokens import DocBin

random.seed(42)

# --- Slot Value Pools ---
INDIAN_NAMES_EN = [
    'Aakash', 'Aarti', 'Aarav', 'Abhishek', 'Advik', 'Ajay', 'Akash', 'Alok', 'Aman', 'Amit',
    'Anand', 'Anil', 'Anita', 'Anjali', 'Ansh', 'Arav', 'Arjun', 'Ashish', 'Atharv', 'Ayush',
    'Barkha', 'Bharat', 'Bhavna', 'Bhupesh', 'Brijesh', 'Chetan', 'Daksh', 'Deepak', 'Deepika',
    'Dev', 'Devansh', 'Dharmesh', 'Dinesh', 'Divya', 'Ganesh', 'Gaurav', 'Geeta', 'Gopal', 'Harsh',
    'Hitesh', 'Jagdish', 'Jignesh', 'Jyoti', 'Kabir', 'Kamal', 'Kamlesh', 'Karan', 'Kartik', 'Kavita',
    'Keshav', 'Kiran', 'Krishna', 'Kuldeep', 'Kunal', 'Lakshman', 'Lalit', 'Madhav', 'Mahesh', 'Mamta',
    'Manish', 'Manoj', 'Mayank', 'Meena', 'Mohan', 'Mohit', 'Monika', 'Mukesh', 'Naresh', 'Naveen',
    'Neha', 'Nidhi', 'Nikhil', 'Nilesh', 'Nitin', 'Pallavi', 'Pankaj', 'Pawan', 'Piyush', 'Pooja',
    'Pradeep', 'Prakash', 'Prashant', 'Prem', 'Priya', 'Raghav', 'Rahul', 'Raj', 'Rajesh', 'Rajeev',
    'Rakesh', 'Ram', 'Ramesh', 'Ravi', 'Rekha', 'Reyansh', 'Rishabh', 'Ritu', 'Rohit', 'Roopa',
    'Sachin', 'Sai', 'Samar', 'Sandeep', 'Sanjay', 'Sanjeev', 'Sapna', 'Sarita', 'Saurabh', 'Shankar',
    'Shaurya', 'Shivam', 'Shubham', 'Shweta', 'Shyam', 'Siddharth', 'Simran', 'Sneha', 'Sohan', 'Sonia',
    'Sumit', 'Sunil', 'Sunita', 'Suresh', 'Swati', 'Tanvi', 'Tarun', 'Tushar', 'Varun', 'Ved',
    'Vihaan', 'Vikas', 'Vikram', 'Vineet', 'Vineeta', 'Vivek', 'Yash', 'Yogesh', 'Nimesh', 'Khatri',
    'Sharma', 'Singh', 'Verma', 'Gupta', 'Patel', 'Shah', 'Desai', 'Kumar', 'Pathak'
]

INDIAN_NAMES_HI = [
    'आकाश', 'आरती', 'आरव', 'अभिषेक', 'अद्विक', 'अजय', 'आलोक', 'अमन', 'अमित', 'आनंद',
    'अनिल', 'अनीता', 'अंजलि', 'अंश', 'अर्जुन', 'आशीष', 'अथर्व', 'आयुष', 'बरखा', 'भरत',
    'भावना', 'भूपेश', 'बृजेश', 'चेतन', 'दक्ष', 'दीपक', 'दीपिका', 'देव', 'देवांश', 'धर्मेश',
    'दिनेश', 'दिव्या', 'गणेश', 'गौरव', 'गीता', 'गोपाल', 'हर्ष', 'हितेश', 'जगदीश', 'जिग्नेश',
    'ज्योति', 'कबीर', 'कमल', 'कमलेश', 'करण', 'कार्तिक', 'कविता', 'केशव', 'किरण', 'कृष्ण',
    'कुलदीप', 'कुणाल', 'लक्ष्मण', 'ललित', 'माधव', 'महेश', 'ममता', 'मनीष', 'मनोज', 'मयंक',
    'मीना', 'मोहन', 'मोहित', 'मोनिका', 'मुकेश', 'नरेश', 'नवीन', 'नेहा', 'निधि', 'निखिल',
    'नीलेश', 'नितिन', 'पल्लवी', 'पंकज', 'पवन', 'पीयूष', 'पूजा', 'प्रदीप', 'प्रकाश', 'प्रशांत',
    'प्रेम', 'प्रिया', 'राघव', 'राहुल', 'राज', 'राजेश', 'राजीव', 'राकेश', 'राम', 'रमेश',
    'रवि', 'रेखा', 'रेयांश', 'ऋषभ', 'रितु', 'रोहित', 'रूपा', 'सचिन', 'साई', 'समर',
    'संदीप', 'संजय', 'संजीव', 'सपना', 'सरिता', 'सौरभ', 'शंकर', 'शौर्य', 'शिवम', 'शुभम',
    'श्वेता', 'श्याम', 'सिद्धार्थ', 'सिमरन', 'स्नेहा', 'सोहन', 'सोनिया', 'सुमित', 'सुनील', 'सुनीता',
    'सुरेश', 'स्वाति', 'तन्वी', 'तरुण', 'तुषार', 'वरुण', 'वेद', 'विहान', 'विकास', 'विक्रम',
    'विनीत', 'विनीता', 'विवेक', 'यश', 'योगेश', 'निमेष', 'खत्री', 'शर्मा', 'सिंह', 'वर्मा',
    'गुप्ता', 'पटेल', 'शाह', 'देसाई', 'कुमार', 'पाठक'
]

PRODUCTS_EN = [
    'Oak Wood Planks', 'Custom Executive Teak Desk', 'Teak Desk', 'Ergonomic Office Chair',
    'Dining Table', 'Conference Table', 'Wooden Bookshelf', 'Office Chair', 'Sofa',
    'Recliner Sofa', 'Coffee Table', 'Bedside Table', 'King Size Bed', 'Study Desk',
    'Wardrobe Cabinet', 'Wooden Chair', 'Executive Chair', 'Storage Cabinet'
]

PRODUCTS_HI = [
    'ओक वुड तख्ता', 'ओक वुड', 'टीक डेस्क', 'कार्यालयीन कुर्सी', 'कुर्सी', 'भोजन मेज़',
    'सम्मेलन मेज़', 'लकड़ी की अल्मारी', 'अलमारी', 'सोफा', 'आराम कुर्सी', 'कॉफ़ी टेबल',
    'अध्ययन मेज़', 'लकड़ी की मेज़', 'मेज़'
]

QTY_EN = [
    '1', '2', '3', '4', '5', '6', '8', '10', '12', '15', '20',
    'one', 'two', 'three', 'four', 'five', 'six', 'ten', 'twelve'
]

QTY_HI = [
    '1', '2', '3', '4', '5', '6', '10', '15',
    'एक', 'दो', 'तीन', 'चार', 'पांच', 'दस', 'बारह',
    'ek', 'do', 'teen', 'char', 'panch', 'dus'
]

PRICES_DIGITS = [
    '450', '650', '850', '1200', '1500', '1800', '2200', '2500', '3200', '3500',
    '4200', '4500', '5000', '5500', '6000', '7500', '8500', '10000', '12000', '15000',
    '18000', '22000', '25000', '32000', '45000'
]

PRICES_WORDS_EN = [
    'five hundred', 'one thousand', 'two thousand', 'three thousand five hundred',
    'four thousand five hundred', 'five thousand', 'six thousand', 'ten thousand'
]

PRICES_WORDS_HI = [
    'पांच सौ', 'एक हज़ार', 'दो हज़ार', 'तीन हज़ार पांच सौ', 'चार हज़ार',
    'पांच हज़ार', 'छह हज़ार', 'दस हज़ार', 'panch sau', 'hazar', 'do hazar', 'panch hazar'
]

DISCOUNTS = [
    '5%', '10%', '15%', '20%', '25%', '5 percent', '10 percent', '15 percent',
    '5 प्रतिशत', '10 प्रतिशत', '15 प्रतिशत', '20 प्रतिशत', '5 pratishat', '10 pratishat'
]

def generate_phone():
    first_digit = str(random.choice([6, 7, 8, 9, 5]))
    rest = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    return first_digit + rest

def build_annotated_sentence(segments):
    """
    Given a list of tuples: [(text, label or None), ...],
    concatenates them, calculating start/end indices for non-None labels.
    Returns (sentence_str, list_of_entities)
    """
    sentence = ""
    entities = []
    for text, label in segments:
        start = len(sentence)
        sentence += text
        end = len(sentence)
        if label:
            entities.append((start, end, label))
    return sentence, entities

def sample_anchored_english():
    name = random.choice(INDIAN_NAMES_EN)
    if random.random() < 0.35:
        name += " " + random.choice(['Sharma', 'Singh', 'Verma', 'Gupta', 'Patel', 'Kumar', 'Pathak'])
    phone = generate_phone()
    prod = random.choice(PRODUCTS_EN)
    qty = random.choice(QTY_EN)
    price = random.choice(PRICES_DIGITS if random.random() < 0.85 else PRICES_WORDS_EN)
    has_discount = random.random() < 0.4
    disc = random.choice(DISCOUNTS) if has_discount else None

    # Variants of phrasing
    v = random.choice([1, 2, 3, 4])
    if v == 1:
        segs = [
            ("customer name ", None), (name, "CUSTOMER_NAME"),
            (", phone ", None), (phone, "PHONE"),
            (", add product ", None), (prod, "PRODUCT"),
            (", quantity ", None), (qty, "QTY"),
            (", price ", None), (price, "PRICE")
        ]
        if has_discount:
            segs.extend([(" with discount ", None), (disc, "DISCOUNT")])
    elif v == 2:
        segs = [
            ("add ", None), (qty, "QTY"),
            (" pieces of ", None), (prod, "PRODUCT"),
            (" at price ", None), (price, "PRICE"),
            (" for client ", None), (name, "CUSTOMER_NAME"),
            (", mobile number ", None), (phone, "PHONE")
        ]
        if has_discount:
            segs.extend([(" with ", None), (disc, "DISCOUNT"), (" off", None)])
    elif v == 3:
        segs = [
            ("name: ", None), (name, "CUSTOMER_NAME"),
            (" phone: ", None), (phone, "PHONE"),
            (" item: ", None), (prod, "PRODUCT"),
            (" qty: ", None), (qty, "QTY"),
            (" rate: ", None), (price, "PRICE")
        ]
        if has_discount:
            segs.extend([(" discount: ", None), (disc, "DISCOUNT")])
    else:
        segs = [
            ("please create bill for ", None), (name, "CUSTOMER_NAME"),
            (" phone is ", None), (phone, "PHONE"),
            (". Product is ", None), (prod, "PRODUCT"),
            (" with quantity ", None), (qty, "QTY"),
            (" and rate ", None), (price, "PRICE")
        ]
        if has_discount:
            segs.extend([(" discount ", None), (disc, "DISCOUNT")])

    return build_annotated_sentence(segs)

def sample_anchored_hindi():
    is_devanagari = random.random() < 0.55
    name = random.choice(INDIAN_NAMES_HI if is_devanagari else INDIAN_NAMES_EN)
    phone = generate_phone()
    prod = random.choice(PRODUCTS_HI if is_devanagari else (PRODUCTS_HI + PRODUCTS_EN))
    qty = random.choice(QTY_HI if is_devanagari else QTY_EN)
    price = random.choice(PRICES_WORDS_HI if is_devanagari and random.random() < 0.4 else PRICES_DIGITS)
    has_discount = random.random() < 0.35
    disc = random.choice(DISCOUNTS) if has_discount else None

    v = random.choice([1, 2, 3, 4])
    if is_devanagari:
        if v == 1:
            segs = [
                ("ग्राहक का नाम ", None), (name, "CUSTOMER_NAME"),
                (" फ़ोन नंबर ", None), (phone, "PHONE"),
                (" उत्पाद ", None), (prod, "PRODUCT"),
                (" मात्रा ", None), (qty, "QTY"),
                (" कीमत ", None), (price, "PRICE")
            ]
            if has_discount:
                segs.extend([(" छूट ", None), (disc, "DISCOUNT")])
        elif v == 2:
            segs = [
                ("नाम ", None), (name, "CUSTOMER_NAME"),
                (" मोबाइल ", None), (phone, "PHONE"),
                (" जोड़ो ", None), (qty, "QTY"),
                (" पीस ", None), (prod, "PRODUCT"),
                (" दाम ", None), (price, "PRICE"),
                (" रुपये", None)
            ]
            if has_discount:
                segs.extend([(" छूट ", None), (disc, "DISCOUNT")])
        elif v == 3:
            segs = [
                ("ग्राहक ", None), (name, "CUSTOMER_NAME"),
                (" के लिए बिल बनाएं, फ़ोन ", None), (phone, "PHONE"),
                (", उत्पाद ", None), (prod, "PRODUCT"),
                (" मात्रा ", None), (qty, "QTY"),
                (" भाव ", None), (price, "PRICE")
            ]
        else:
            segs = [
                ("डालो ", None), (qty, "QTY"),
                (" ", None), (prod, "PRODUCT"),
                (" कीमत ", None), (price, "PRICE"),
                (" ग्राहक ", None), (name, "CUSTOMER_NAME"),
                (" नंबर ", None), (phone, "PHONE")
            ]
    else: # Hinglish
        if v == 1:
            segs = [
                ("naam ", None), (name, "CUSTOMER_NAME"),
                (" phone number ", None), (phone, "PHONE"),
                (" product ", None), (prod, "PRODUCT"),
                (" matra ", None), (qty, "QTY"),
                (" keemat ", None), (price, "PRICE")
            ]
            if has_discount:
                segs.extend([(" discount ", None), (disc, "DISCOUNT")])
        elif v == 2:
            segs = [
                ("customer ", None), (name, "CUSTOMER_NAME"),
                (" phone ", None), (phone, "PHONE"),
                (" jodo ", None), (qty, "QTY"),
                (" ", None), (prod, "PRODUCT"),
                (" rate ", None), (price, "PRICE"),
                (" rupaye", None)
            ]
        elif v == 3:
            segs = [
                ("kripya ", None), (name, "CUSTOMER_NAME"),
                (" ke liye bill banao, mobile ", None), (phone, "PHONE"),
                (" item ", None), (prod, "PRODUCT"),
                (" qty ", None), (qty, "QTY"),
                (" price ", None), (price, "PRICE")
            ]
        else:
            segs = [
                (qty, "QTY"), (" pieces ", None), (prod, "PRODUCT"),
                (" price ", None), (price, "PRICE"),
                (" for customer ", None), (name, "CUSTOMER_NAME"),
                (" phone ", None), (phone, "PHONE")
            ]

    return build_annotated_sentence(segs)

def sample_positional():
    is_hi = random.random() < 0.4
    name = random.choice(INDIAN_NAMES_HI if is_hi else INDIAN_NAMES_EN)
    phone = generate_phone()
    prod = random.choice(PRODUCTS_HI if is_hi else PRODUCTS_EN)
    qty = str(random.randint(1, 15))
    price = random.choice(PRICES_DIGITS)

    v = random.choice([1, 2, 3, 4, 5])
    if v == 1: # "rahul 5565428785 oak wood planks"
        segs = [
            (name, "CUSTOMER_NAME"), (" ", None),
            (phone, "PHONE"), (" ", None),
            (prod, "PRODUCT")
        ]
    elif v == 2: # "rahul 5565428785 oak wood planks 2 4500"
        segs = [
            (name, "CUSTOMER_NAME"), (" ", None),
            (phone, "PHONE"), (" ", None),
            (prod, "PRODUCT"), (" ", None),
            (qty, "QTY"), (" ", None),
            (price, "PRICE")
        ]
    elif v == 3: # inverted order "rahul 5565428785 oak wood planks 4500 2"
        segs = [
            (name, "CUSTOMER_NAME"), (" ", None),
            (phone, "PHONE"), (" ", None),
            (prod, "PRODUCT"), (" ", None),
            (price, "PRICE"), (" ", None),
            (qty, "QTY")
        ]
    elif v == 4: # product first "oak wood planks 2 4500 rahul 5565428785"
        segs = [
            (prod, "PRODUCT"), (" ", None),
            (qty, "QTY"), (" ", None),
            (price, "PRICE"), (" ", None),
            (name, "CUSTOMER_NAME"), (" ", None),
            (phone, "PHONE")
        ]
    else: # name product price qty phone
        segs = [
            (name, "CUSTOMER_NAME"), (" ", None),
            (prod, "PRODUCT"), (" ", None),
            (price, "PRICE"), (" ", None),
            (qty, "QTY"), (" ", None),
            (phone, "PHONE")
        ]

    return build_annotated_sentence(segs)

def main():
    print("Generating synthetic dataset for spaCy NER...")
    nlp = spacy.blank("xx") # multilingual blank

    TOTAL_SAMPLES = 4200
    n_anchored_en = int(TOTAL_SAMPLES * 0.40) # 1680
    n_anchored_hi = int(TOTAL_SAMPLES * 0.30) # 1260
    n_positional = TOTAL_SAMPLES - n_anchored_en - n_anchored_hi # 1260

    dataset = []
    style_counts = {"anchored_en": 0, "anchored_hi": 0, "positional": 0}

    for _ in range(n_anchored_en):
        text, ents = sample_anchored_english()
        dataset.append((text, ents, "anchored_en"))
        style_counts["anchored_en"] += 1

    for _ in range(n_anchored_hi):
        text, ents = sample_anchored_hindi()
        dataset.append((text, ents, "anchored_hi"))
        style_counts["anchored_hi"] += 1

    for _ in range(n_positional):
        text, ents = sample_positional()
        dataset.append((text, ents, "positional"))
        style_counts["positional"] += 1

    random.shuffle(dataset)

    label_counts = {
        "CUSTOMER_NAME": 0, "PHONE": 0, "PRODUCT": 0,
        "QTY": 0, "PRICE": 0, "DISCOUNT": 0
    }

    train_db = DocBin()
    dev_db = DocBin()

    split_idx = int(len(dataset) * 0.85)
    train_data = dataset[:split_idx]
    dev_data = dataset[split_idx:]

    skipped = 0
    for idx, (text, ents, style) in enumerate(dataset):
        doc = nlp.make_doc(text)
        spacy_ents = []
        for start, end, label in ents:
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                span = doc.char_span(start, end, label=label, alignment_mode="expand")
            if span is not None:
                spacy_ents.append(span)
                label_counts[label] += 1
            else:
                skipped += 1
        
        # Filter overlapping spans if any
        try:
            doc.ents = spacy.util.filter_spans(spacy_ents)
        except Exception:
            doc.ents = []

        if idx < split_idx:
            train_db.add(doc)
        else:
            dev_db.add(doc)

    out_dir = os.path.dirname(os.path.abspath(__file__))
    train_path = os.path.join(out_dir, "train.spacy")
    dev_path = os.path.join(out_dir, "dev.spacy")

    train_db.to_disk(train_path)
    dev_db.to_disk(dev_path)

    print("\n" + "="*50)
    print("DATASET GENERATION SUMMARY")
    print("="*50)
    print(f"Total Sentences Generated : {len(dataset)}")
    print(f"  - Train Set (85%)       : {len(train_data)} -> {train_path}")
    print(f"  - Dev Set (15%)         : {len(dev_data)} -> {dev_path}")
    print("\nStyle Breakdown:")
    for style, count in style_counts.items():
        pct = (count / len(dataset)) * 100
        print(f"  - {style:<15} : {count:5d} ({pct:.1f}%)")
    print("\nPer-Label Entity Counts:")
    for label, count in label_counts.items():
        print(f"  - {label:<15} : {count:5d}")
    if skipped > 0:
        print(f"\nWarning: {skipped} spans skipped due to character offset alignment")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
