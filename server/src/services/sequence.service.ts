import { localDB } from '../db/db.js';

export class SequenceService {
  static nextDocNumber(code: string): string {
    let nextNum = 1;
    let prefix = code;
    let padding = 5;

    localDB.update(state => {
      let seq = state.doc_sequences.find((s: any) => s.code === code);
      if (!seq) {
        if (code === 'PO') {
          prefix = 'P';
          padding = 5;
        } else if (code === 'BILL') {
          prefix = `Bill/${new Date().getFullYear()}/`;
          padding = 4;
        } else if (code === 'INV') {
          prefix = `Inv/${new Date().getFullYear()}/`;
          padding = 4;
        }
        seq = { code, prefix, current_value: 0, padding };
        state.doc_sequences.push(seq);
      }

      seq.current_value += 1;
      nextNum = seq.current_value;
      prefix = seq.prefix;
      padding = seq.padding;
    });

    return `${prefix}${nextNum.toString().padStart(padding, '0')}`;
  }
}
