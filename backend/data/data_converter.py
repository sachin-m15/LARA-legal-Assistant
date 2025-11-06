import os
import json
import fitz  # PyMuPDF


def convert_pdfs_to_txt(source_dir: str, dest_dir: str):
    """Converts all PDF files in a source directory to text files."""
    print("--- Converting PDF files to text... ---")
    if not os.path.exists(source_dir):
        print(f"❌ Source directory '{source_dir}' not found. Please place your PDF files here.")
        return

    for filename in os.listdir(source_dir):
        if filename.lower().endswith(".pdf"):
            pdf_path = os.path.join(source_dir, filename)
            txt_filename = os.path.splitext(filename)[0] + ".txt"
            txt_path = os.path.join(dest_dir, txt_filename)

            try:
                doc = fitz.open(pdf_path)
                text_content = ""
                for page in doc:
                    text_content += page.get_text("text")

                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(text_content)

                print(f"✅ Converted: {filename} → {txt_filename}")
            except Exception as e:
                print(f"⚠️ Error converting '{filename}': {e}")


def convert_json_to_txt(source_dir: str, dest_dir: str):
    """Converts all JSON files with Q&A pairs to text files."""
    print("--- Converting JSON files to text... ---")
    if not os.path.exists(source_dir):
        print(f"⚠️ Source directory '{source_dir}' not found. Skipping JSON conversion.")
        return

    for filename in os.listdir(source_dir):
        if filename.lower().endswith(".json"):
            json_path = os.path.join(source_dir, filename)
            txt_filename = os.path.splitext(filename)[0] + ".txt"
            txt_path = os.path.join(dest_dir, txt_filename)

            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                text_content = ""
                for entry in data:
                    if "question" in entry and "answer" in entry:
                        text_content += f"Question: {entry['question']}\nAnswer: {entry['answer']}\n\n"

                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(text_content)

                print(f"✅ Converted JSON: {filename} → {txt_filename}")
            except Exception as e:
                print(f"⚠️ Error converting '{filename}': {e}")


if __name__ == "__main__":
    # Automatically resolve directories relative to this script's location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    source_data_dir = os.path.abspath(os.path.join(base_dir, "..", "raw_data"))
    dest_data_dir = os.path.join(base_dir, "indian_law_docs")

    # Ensure destination exists
    os.makedirs(dest_data_dir, exist_ok=True)

    print(f"Source directory: {source_data_dir}")
    print(f"Destination directory: {dest_data_dir}\n")

    convert_pdfs_to_txt(source_data_dir, dest_data_dir)
    convert_json_to_txt(source_data_dir, dest_data_dir)

    print("\n✅ Conversion complete!")
    print("All processed text files are available in 'data/indian_law_docs/'.")
    print("Now run:  python data/faiss_indexer.py  to generate the FAISS index.")
