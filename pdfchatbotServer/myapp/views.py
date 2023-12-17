from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader
from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI
import config

@method_decorator(csrf_exempt, name='dispatch')
class PDFView(View):
    def post(self, request, *args, **kwargs):
        import tempfile

        # Get the uploaded file from the request
        uploaded_file = request.FILES['file']

        # Create a temporary file and write the uploaded file's content to it
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            for chunk in uploaded_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        # Now, tmp_path is the path of the temporary file that contains the uploaded file's content
        loader = PyPDFLoader(tmp_path)

        # Extract text from the PDF file
        pages = loader.load_and_split()

        # Create an OpenAI Embeddings object
        embeddings = OpenAIEmbeddings(openai_api_key=config.OPENAI_API_KEY)

        # Create a FAISS index from the pages
        index = FAISS.from_documents(pages, embeddings)

        # write_index(index, "faiss_index")
        index.save_local("faiss_index")

        return JsonResponse({'results': ['File Uploaded']})


# This endpoint will access the FAISS index that was created by the PDFView endpoint
@method_decorator(csrf_exempt, name='dispatch')
class FAISSView(View):
    def post(self, request, *args, **kwargs):
        # Load the FAISS index
        embeddings = OpenAIEmbeddings(openai_api_key=config.OPENAI_API_KEY)
        index = FAISS.load_local("faiss_index", embeddings)

        # Get the user's question
        body_unicode = request.body.decode('utf-8')

        # Parse the string into a Python dictionary
        body = json.loads(body_unicode)

        # Now you can access the 'question' key from the dictionary
        question = body.get('question', '')

        # Create the chain
        chain = load_qa_chain(OpenAI(openai_api_key=config.OPENAI_API_KEY), chain_type="stuff")

        # Search the FAISS index for documents that are similar to the user's question
        docs = index.similarity_search(question, k=4)

        # Get the result of the chain
        answer = chain.run(input_documents=docs, question=question)

        return JsonResponse({'results': answer})
