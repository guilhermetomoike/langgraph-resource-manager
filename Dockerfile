FROM python:3.11-slim

WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY src/ ./src/
COPY tests/ ./tests/

# Expor porta
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
