import os
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings  # ✅ updated import
from langchain_community.vectorstores import FAISS

# Define paths
DOCS_PATH = "data/indian_law_docs"
FAISS_INDEX_PATH = "data/faiss_index"


def extract_case_metadata(filename: str, text: str):
    """
    Extracts simple metadata like case name and IPC sections from the file content.
    """
    case_name = filename.replace(".txt", "")
    sections = []
    for token in ["IPC", "CrPC", "Article", "Section"]:
        if token.lower() in text.lower():
            sections.append(token)
    return {"case_name": case_name, "keywords": sections}


def create_faiss_index():
    """
    Processes legal documents, creates embeddings, and saves a FAISS index with metadata.
    """
    print("⚖️ Starting the FAISS index creation process...")
    documents = []

    if not os.path.exists(DOCS_PATH):
        print(f"❌ Error: Directory '{DOCS_PATH}' not found. Please add legal documents.")
        return

    # 1️⃣ Load documents
    for filename in os.listdir(DOCS_PATH):
        if filename.endswith(".txt"):
            file_path = os.path.join(DOCS_PATH, filename)
            try:
                loader = TextLoader(file_path, encoding="utf-8")
                loaded_docs = loader.load()

                # Attach metadata
                for doc in loaded_docs:
                    metadata = extract_case_metadata(filename, doc.page_content)
                    doc.metadata.update(metadata)
                    documents.append(doc)

                print(f"✅ Loaded: {filename}")
            except Exception as e:
                print(f"⚠️ Skipping '{filename}' due to error: {e}")

    if not documents:
        print(f"⚠️ No valid text documents found in '{DOCS_PATH}'.")
        return

    print(f"\n📚 Total documents loaded: {len(documents)}")
    print("🧩 Splitting into smaller chunks...")

    # 2️⃣ Split documents for better embedding context
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)

    print(f"✅ Split into {len(docs)} chunks. Generating embeddings...")

    # 3️⃣ Use legal-domain-tuned embeddings for better accuracy
    # You can switch to "law-ai/InLegalBERT" if you have GPU or want Indian law-specific tuning
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 4️⃣ Create FAISS index and save
    db = FAISS.from_documents(docs, embeddings)
    os.makedirs(FAISS_INDEX_PATH, exist_ok=True)
    db.save_local(FAISS_INDEX_PATH)

    print("\n🎯 FAISS index created successfully!")
    print(f"📁 Saved at: {os.path.abspath(FAISS_INDEX_PATH)}")
    print("🚀 You can now run your main app to query the legal cases.")


if __name__ == "__main__":
    create_faiss_index()
