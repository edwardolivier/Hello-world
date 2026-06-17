# Energy Tracker — GCP Setup Guide

## Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed locally
- Anthropic API key

---

## Step 1: Create a GCP Project

```bash
gcloud projects create energy-tracker-YOUR-NAME --name="Energy Tracker"
gcloud config set project energy-tracker-YOUR-NAME
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com firestore.googleapis.com containerregistry.googleapis.com
```

---

## Step 2: Set Up Firestore

In GCP Console → Firestore → Create database:
- Select **Native mode**
- Region: `australia-southeast1`

---

## Step 3: Store Secrets in Secret Manager

```bash
# Anthropic API key
echo -n "YOUR_ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key --data-file=-

# JWT secret (generate a random one)
openssl rand -hex 32 | gcloud secrets create jwt-secret-key --data-file=-
```

---

## Step 4: Grant Cloud Run Access to Secrets & Firestore

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Secret Manager access
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/secretmanager.secretAccessor"

# Firestore access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/datastore.user"
```

---

## Step 5: Connect GitHub to Cloud Build

1. GCP Console → Cloud Build → Triggers → Connect Repository
2. Select GitHub → Authorize → Select `edwardolivier/Hello-world`
3. Create trigger:
   - Event: Push to branch `main`
   - Config: `cloudbuild.yaml`
   - Substitutions: none needed (uses Secret Manager)

---

## Step 6: Deploy

Push to `main` branch — Cloud Build automatically:
1. Builds the Docker image (frontend + backend)
2. Pushes to Container Registry
3. Deploys to Cloud Run in `australia-southeast1`

Your app URL will appear in Cloud Run console.

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in your values
uvicorn main:app --reload --port 8080

# Frontend (in another terminal)
cd frontend
npm install
npm run dev   # runs on :5173, proxies /api to :8080
```

---

## Notes
- Bills are stored per user in Firestore subcollections (`users/{username}/bills/`)
- PDFs are NOT stored — only the extracted data
- Market comparison uses Claude's knowledge of QLD retailers + attempts to query energymadeeasy.gov.au
- Rates are in **cents per kWh** and **cents per day** as displayed on QLD bills
