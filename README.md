# ⚖️ L.A.R.A – Legal Analysis Research Assistant

## 🧠 Overview
**L.A.R.A (Legal Analysis and Research Assistant)** is an intelligent, Python-based backend application designed to help **lawyers, researchers, and citizens** conduct deep legal research and case studies based on **Indian law**.

Inspired by the concept of **autonomous legal research agents**, L.A.R.A automates the end-to-end process — transforming user queries into precise legal search terms, retrieving authoritative data from multiple sources, and generating a **structured, citable legal analysis** that is **self-evaluated with a real-time confidence score.**

The system uses **LangGraph** for modular agent orchestration and **Retrieval-Augmented Generation (RAG)** to combine internal legal corpora with live web data.

---

## 🚀 Features
- **Intelligent Query Rewriting:** Reformulates user-entered legal problems into precise, law-aware search queries.  
- **Role-Based Agents:**  
  - *Citizen Mode* – For general legal guidance and awareness.  
  - *Lawyer Mode* – For in-depth case law analysis, statutory interpretation, and references.  
- **Hybrid Data Retrieval:** Combines FAISS-based local document search with live web lookups via APIs (e.g., Tavily Search).  
- **Iterative Legal Reasoning:** Dynamically refines its understanding of a legal problem and continues searching until it builds a complete answer.  
- **Structured Legal Analysis:** Synthesizes case law, acts, and judgments into clear, referenced summaries.  
- **Citation System:** Each generated report contains references to primary sources and acts for validation and research traceability.
- **In-line Confidence Score:** Runs an in-line evaluator at the end of every query to provide a real-time "Confidence Score" (based on relevance, faithfulness, and clarity) directly to the user, building trust in the generated answer.

---

## 🧰 Tech Stack

| Component | Technology Used |
|------------|----------------|
| **Backend Framework** | FastAPI (Python) |
| **Agent Orchestration** | LangGraph |
| **Embeddings + Search** | FAISS Vector Store |
| **Language Model** | Groq (LLaMA 3.1–8B Instant) |
| **Embeddings (Vector DB)** | FAISS Vector Store |
| **Embeddings (Evaluation)** |	Sentence-Transformers |
| **APIs Used** | Tavily Search API |
| **In-line Evaluation** | LLM-as-a-Judge (Groq) + Semantic Similarity |
| **Frontend** | React + Tailwind CSS |
| **Environment Management** | `dotenv` |

---

## 🏗️ Project Structure

```
L.A.R.A-Legal-Analysis-Research-Agent/
│
├── backend/  
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── citizen_agent.py
│   │   ├── lawyer_agent.py
│   │   └── router.py
│   │
│   ├── data/
│   │   ├── faiss_index/
│   │   ├── indian_law_docs/
│   │   └── data_converter.py
│   │
│   ├── legal_rag/
│   │   ├── query_rewriter.py
│   │   ├── retrieval.py
│   │   └── summarizer.py
│   ├── raw_data/
│   │
│   ├── .env
│   ├── app.py
│   ├── db.py
│   ├── model_score_checker.py
│
├── frontend/
│   ├── src/
│   └── index.html
│   
├── .gitignore
└── README.md

```


## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Rashi-Dwivedi1812/L.A.R.A-Legal-Analysis-Research-Assistant.git
    cd L.A.R.A-Legal-Analysis-Research-Assistant
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    venv\Scripts\activate  # (on Windows)
    pip install -r requirements.txt
    ```

3.  **Set Environment Variables**
   Create a .env file inside /backend:
    ```
    GROQ_API_KEY="your_grok_api_key_here"
    TAVILY_API_KEY="your_tavily_api_key_here"
    ```

4.  **Prepare Legal Data**
    * Place your legal documents (PDFs, JSONs) in the `raw_data/` directory.
    * Run the `data_converter.py` script to process them and create the FAISS index.
      
    ```bash
    python data/data_converter.py
    python data/faiss_index/faiss_indexer.py
    ```

5. **Run the Backend**
   ```
   uvicorn app:app --reload
   ```
   Your FastAPI backend will now be available at:
   ```
   http://127.0.0.1:8000
   ```

## 💻 Frontend (React)

1. **Navigate to Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev

    ```

2. **Access the UI**
    ```bash
    http://localhost:5173
    ```
---

## 📊 Example Queries
- The Securities and Exchange Board of India (SEBI) Act, 1992. 
- Foreign Exchange Management Act (FEMA), 1999
- Summarize the judgment in Chunna @ Charan Singh vs State of M.P.
- Explain Section 2A introduced in the Railways Amendment Act, 2025.
- The Insolvency and Bankruptcy Code (IBC).
- Compare provisions under IPC Sections 302 and 304B with recent case law.

## 🧩 Future Enhancements
- 🧠 Multi-document synthesis for cross-case reasoning
- ⚖️ Integration with Indian Kanoon & Law Commission datasets
- 🕵️‍♀️ Named entity recognition for legal citations
- 🔗 Graph-based linking between Acts, Sections, and Cases

---

## 🏁 Contributing
Pull requests are welcome!
To contribute:
```bash
git checkout -b feature/your-feature
git commit -m "Add feature: your-feature"
git push origin feature/your-feature
```

> 💡 *“Alone we can do so little; together we can do so much.” – Helen Keller*

  
