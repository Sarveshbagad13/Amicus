import re
from typing import List, Dict, Any

class DocumentChunker:
    """
    Token-aware and section-aware document chunker for handling long legal contracts
    within model context window limits (e.g. 1024 tokens for BART/RoBERTa).
    """

    @classmethod
    def chunk_text(
        cls,
        text: str,
        max_words_per_chunk: int = 500,  # ~650-750 subword tokens, well within 1024 limits
        overlap_words: int = 60           # ~80 subword tokens overlap for context continuity
    ) -> List[Dict[str, Any]]:
        """
        Partition full document text into overlapping chunks with precise start/end character offsets.
        """
        if not text or not text.strip():
            return []

        # Find paragraphs and their character spans in original text
        para_matches = [m for m in re.finditer(r"\S[^\n]*(?:\n(?!\n)\S[^\n]*)*", text)]
        if not para_matches:
            # Fallback if text is single line
            words = text.split()
            return [{
                "chunk_index": 0,
                "text": text.strip(),
                "start_char": 0,
                "end_char": len(text),
                "word_count": len(words)
            }]

        paragraphs = []
        for m in para_matches:
            p_text = m.group(0).strip()
            if p_text:
                paragraphs.append({
                    "text": p_text,
                    "start_char": m.start(),
                    "end_char": m.end(),
                    "word_count": len(p_text.split())
                })

        chunks = []
        current_chunk_paras = []
        current_word_count = 0

        for p in paragraphs:
            if current_word_count + p["word_count"] > max_words_per_chunk and current_chunk_paras:
                # Seal current chunk
                chunk_start = current_chunk_paras[0]["start_char"]
                chunk_end = current_chunk_paras[-1]["end_char"]
                chunk_raw_text = text[chunk_start:chunk_end].strip()

                if chunk_raw_text:
                    chunks.append({
                        "chunk_index": len(chunks),
                        "text": chunk_raw_text,
                        "start_char": chunk_start,
                        "end_char": chunk_end,
                        "word_count": current_word_count
                    })

                # Calculate overlap
                overlap_paras = []
                overlap_words_acc = 0
                for prev_p in reversed(current_chunk_paras):
                    if overlap_words_acc + prev_p["word_count"] <= overlap_words:
                        overlap_paras.insert(0, prev_p)
                        overlap_words_acc += prev_p["word_count"]
                    else:
                        break

                current_chunk_paras = list(overlap_paras)
                current_word_count = overlap_words_acc

            current_chunk_paras.append(p)
            current_word_count += p["word_count"]

        if current_chunk_paras:
            chunk_start = current_chunk_paras[0]["start_char"]
            chunk_end = current_chunk_paras[-1]["end_char"]
            chunk_raw_text = text[chunk_start:chunk_end].strip()
            if chunk_raw_text:
                chunks.append({
                    "chunk_index": len(chunks),
                    "text": chunk_raw_text,
                    "start_char": chunk_start,
                    "end_char": chunk_end,
                    "word_count": current_word_count
                })

        return chunks
