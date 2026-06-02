FROM python:3.12-slim-bookworm AS base
WORKDIR /phishvigil
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY --from=ghcr.io/astral-sh/uv:0.11.16 /uv /uvx /bin/

COPY uv.lock pyproject.toml ./
RUN uv sync --frozen --no-dev
ENV PATH="/phishvigil/.venv/bin:$PATH"

COPY ./app ./app

FROM base AS test-runner

RUN uv sync --frozen --dev
COPY ./tests ./tests

ENTRYPOINT ["pytest"]

FROM base AS production

EXPOSE 8000

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]