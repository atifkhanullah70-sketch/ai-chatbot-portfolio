FROM python:3.11-slim

WORKDIR /app

# Copy requirements first
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]