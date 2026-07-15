# PredixRoute — Final Year Project Report Format

**Project Title:** PredixRoute — AI-Powered Logistics Intelligence Platform & API Infrastructure  
**Domain:** Software Engineering / Artificial Intelligence / Logistics Technology  
**Architecture:** Multi-tenant SaaS Monorepo (React + Node.js + FastAPI + MongoDB + Redis)

---

## Front Matter

| Section | Page |
|---------|------|
| Cover Page | i |
| Certificate | ii |
| Declaration | iii |
| Acknowledgement | iv |
| **Table of Contents** | v |
| **List of Tables** | vi |
| **List of Figures** | vii |
| **List of Abbreviations and Symbols** | viii |
| **Abstract** | ix |

---

## Table of Contents

*Numbering convention: Chapter.Heading.Subheading (e.g., 2.3.1)*

---

### CHAPTER 1 — INTRODUCTION

**1.1** Background of the Study  
**1.2** Problem Statement  
&nbsp;&nbsp;&nbsp;&nbsp;1.2.1 High RTO (Return-to-Origin) Rates in Indian E-commerce Logistics  
&nbsp;&nbsp;&nbsp;&nbsp;1.2.2 Lack of Pre-dispatch Risk Intelligence in OMS/ERP Systems  
&nbsp;&nbsp;&nbsp;&nbsp;1.2.3 Absence of Explainable AI in Courier Decision-Making  

**1.3** Objectives of the Project  
&nbsp;&nbsp;&nbsp;&nbsp;1.3.1 Primary Objective — Build an AI-Powered Shipment Risk Evaluation Platform  
&nbsp;&nbsp;&nbsp;&nbsp;1.3.2 Secondary Objectives — Courier Recommendation, Pincode Intelligence, API Infrastructure  

**1.4** Scope of the Project  
&nbsp;&nbsp;&nbsp;&nbsp;1.4.1 In-Scope Features (Implemented)  
&nbsp;&nbsp;&nbsp;&nbsp;1.4.2 Out-of-Scope / Future Enhancements (Planned Slices)  

**1.5** Organization of the Report  

---

### CHAPTER 2 — SYSTEM ANALYSIS

**2.1** Identification of Need  
&nbsp;&nbsp;&nbsp;&nbsp;2.1.1 Stakeholder Analysis  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Logistics Companies & E-commerce Sellers  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. OMS/ERP/WMS Integrators  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Platform Administrators (Super Admin)  
&nbsp;&nbsp;&nbsp;&nbsp;2.1.2 Existing System Limitations  
&nbsp;&nbsp;&nbsp;&nbsp;2.1.3 Proposed Solution — PredixRoute Platform Overview  

**2.2** Preliminary Investigation  
&nbsp;&nbsp;&nbsp;&nbsp;2.2.1 Study of Existing Logistics Intelligence Tools  
&nbsp;&nbsp;&nbsp;&nbsp;2.2.2 Survey of Courier Aggregators and Risk Scoring Approaches  
&nbsp;&nbsp;&nbsp;&nbsp;2.2.3 Data Availability — MIS/Shipment Export Analysis  

**2.3** Feasibility Study  
&nbsp;&nbsp;&nbsp;&nbsp;2.3.1 Technical Feasibility  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Monorepo Architecture (Frontend / Backend / AI Service)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. ML Model Feasibility (XGBoost on Historical Shipment Data)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Third-Party Integrations (Twilio WhatsApp, OpenAI, SMTP)  
&nbsp;&nbsp;&nbsp;&nbsp;2.3.2 Operational Feasibility  
&nbsp;&nbsp;&nbsp;&nbsp;2.3.3 Economic Feasibility  
&nbsp;&nbsp;&nbsp;&nbsp;2.3.4 Schedule Feasibility  

**2.4** Project Planning  
&nbsp;&nbsp;&nbsp;&nbsp;2.4.1 Development Methodology — Agile Iterative Slices  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Slice 1 — Backend Core, Auth, Public Risk API, AI Inference  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Slice 2 — Dashboard APIs, Pincode/Courier Intelligence, React UI  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Extended Features — Webhooks, Bulk Predictions, COD Verification, Model Training  

**2.5** Project Scheduling  
&nbsp;&nbsp;&nbsp;&nbsp;2.5.1 Work Breakdown Structure (WBS)  
&nbsp;&nbsp;&nbsp;&nbsp;2.5.2 Gantt Chart  
&nbsp;&nbsp;&nbsp;&nbsp;2.5.3 PERT Chart  
&nbsp;&nbsp;&nbsp;&nbsp;2.5.4 Milestones and Deliverables  

**2.6** Software Requirement Specification (SRS)  
&nbsp;&nbsp;&nbsp;&nbsp;2.6.1 Functional Requirements  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. User Authentication & Multi-Tenant Organization Management  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Shipment Risk Evaluation (Single & Batch)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Courier Recommendation Engine  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Pincode & Courier Intelligence APIs  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. API Key Management & Public REST API  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F. Dashboard — Prediction History & SHAP Explanations  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G. Webhook Event Delivery (HMAC-Signed)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H. COD AI Verification via WhatsApp  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I. Bulk CSV Prediction Jobs (BullMQ)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;J. Admin Console — Tenant Management & Model Training  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;K. Training Data Contribution & Governance  
&nbsp;&nbsp;&nbsp;&nbsp;2.6.2 Non-Functional Requirements  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Performance (API Latency, Rate Limits)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Scalability (Multi-Tenant Isolation)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Security (JWT, RBAC, API Key Hashing)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Availability & Graceful Shutdown  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Observability & Health Checks  
&nbsp;&nbsp;&nbsp;&nbsp;2.6.3 Hardware Requirements  
&nbsp;&nbsp;&nbsp;&nbsp;2.6.4 Software Requirements  

**2.7** Software Engineering Paradigm Applied  
&nbsp;&nbsp;&nbsp;&nbsp;2.7.1 Layered Architecture + Microservice Pattern (AI Service)  
&nbsp;&nbsp;&nbsp;&nbsp;2.7.2 Repository Pattern & Service-Oriented Design  
&nbsp;&nbsp;&nbsp;&nbsp;2.7.3 RESTful API Design Principles  
&nbsp;&nbsp;&nbsp;&nbsp;2.7.4 Event-Driven Background Processing (BullMQ Workers)  

**2.8** System Modeling Diagrams  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.1 System Context Diagram (C4)  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.2 Use Case Diagram  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Customer Portal Use Cases  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Platform Admin Use Cases  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Public API Integrator Use Cases  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.3 Data Flow Diagram (DFD)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Level 0 — Context DFD  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Level 1 — Risk Evaluation Process  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.4 Entity Relationship Diagram (ERD) — MongoDB Collections  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.5 Class Diagram  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Backend Domain Models  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. AI Service ML Pipeline Classes  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.6 Sequence Diagrams  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. User Registration & Email Verification  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. JWT Login & Refresh Token Rotation  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Public API Risk Evaluation Flow  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. COD WhatsApp Verification Flow  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Bulk Prediction Job Processing  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F. Model Training Pipeline  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.7 Activity Diagram — End-to-End Shipment Risk Assessment  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.8 State Diagram — COD Verification Session States  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.9 Component Diagram — Monorepo Service Topology  
&nbsp;&nbsp;&nbsp;&nbsp;2.8.10 Deployment Diagram — Docker + Nginx Production Stack  

---

### CHAPTER 3 — SYSTEM DESIGN

**3.1** Modularisation Details  
&nbsp;&nbsp;&nbsp;&nbsp;3.1.1 Frontend Module (`frontend/`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Marketing Site (`/`, `/features`, `/pricing`, `/try`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Customer Portal (`/app/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Platform Admin Console (`/admin/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Developer Portal (`/app/developers`)  
&nbsp;&nbsp;&nbsp;&nbsp;3.1.2 Backend Module (`backend/`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Auth Module (JWT, Refresh Rotation, Lockout)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Public API Module (`/api/v1/public/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Dashboard API Module (`/api/v1/dashboard/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Admin API Module  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Background Jobs (BullMQ Workers)  
&nbsp;&nbsp;&nbsp;&nbsp;3.1.3 AI Service Module (`ai-service/`)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Feature Pipeline  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Inference Engine  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Training Pipeline  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. SHAP Explainability Module  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Model Registry  
&nbsp;&nbsp;&nbsp;&nbsp;3.1.4 Infrastructure Module (`infrastructure/`)  

**3.2** Data Integrity and Constraints  
&nbsp;&nbsp;&nbsp;&nbsp;3.2.1 Tenant Isolation (`organizationId` on Every Document)  
&nbsp;&nbsp;&nbsp;&nbsp;3.2.2 Soft Delete Strategy (`deletedAt`)  
&nbsp;&nbsp;&nbsp;&nbsp;3.2.3 Input Validation (Zod Schemas)  
&nbsp;&nbsp;&nbsp;&nbsp;3.2.4 Unique Constraints (Slug, API Key Hash, Public IDs)  
&nbsp;&nbsp;&nbsp;&nbsp;3.2.5 Training Data Governance Rules (No Label Leakage)  

**3.3** Database Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.3.1 MongoDB Collections Overview  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Organizations  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Users  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. API Keys & API Subscriptions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Predictions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Pincode Performance  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F. Courier Performance  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G. Webhooks & Webhook Deliveries  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H. Bulk Prediction Jobs  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I. COD Verification Sessions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;J. Datasets & Training Contributions  
&nbsp;&nbsp;&nbsp;&nbsp;3.3.2 Indexing Strategy  
&nbsp;&nbsp;&nbsp;&nbsp;3.3.3 Redis Data Structures (Sessions, Rate Limits, Queues)  

**3.4** Procedural / Object-Oriented Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.4.1 Backend Layered Architecture  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Routes → Controllers → Services → Repositories → Models  
&nbsp;&nbsp;&nbsp;&nbsp;3.4.2 AI Service Pipeline Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.4.3 Middleware Chain Design  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Authentication Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. API Key Auth Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. RBAC Authorization Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. Rate Limiting Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Error Handler Middleware  

**3.5** Machine Learning System Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.1 Feature Engineering Pipeline  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Pincode Risk Features  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Courier Performance Features  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Shipment Attributes (Weight, COD, Order Value, Address Quality)  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.2 Model Portfolio (Logistic Regression, Random Forest, XGBoost)  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.3 Model Selection Criteria (F1 Score, Cross-Validation)  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.4 Risk Classification (LOW / MEDIUM / HIGH / CRITICAL)  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.5 Courier Recommendation Algorithm  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.6 SHAP Explainability Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.5.7 Model Registry & Artifact Storage  

**3.6** User Interface Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.6.1 UI Technology Stack (React, Vite, MUI, TanStack Query)  
&nbsp;&nbsp;&nbsp;&nbsp;3.6.2 Customer Dashboard Screens  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. Risk Evaluation Form with SHAP Explanations  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. Prediction History & Detail View  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. Pincode Intelligence Table  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D. API Key Management  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;E. Usage & Quota Dashboard  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;F. Webhook Configuration  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;G. COD Verification Monitor  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H. Bulk Prediction Upload  
&nbsp;&nbsp;&nbsp;&nbsp;3.6.3 Platform Admin Console Screens  
&nbsp;&nbsp;&nbsp;&nbsp;3.6.4 Marketing Website Screens  
&nbsp;&nbsp;&nbsp;&nbsp;3.6.5 Navigation & Role-Based Access Control in UI  

**3.7** API Design  
&nbsp;&nbsp;&nbsp;&nbsp;3.7.1 Public REST API (`/api/v1/public/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;3.7.2 Dashboard API (`/api/v1/dashboard/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;3.7.3 Authentication API (`/api/v1/auth/*`)  
&nbsp;&nbsp;&nbsp;&nbsp;3.7.4 OpenAPI Specification  

---

### CHAPTER 4 — CODING

**4.1** Technology Stack Summary  

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, MUI, TanStack Query |
| Backend | Node.js, Express, TypeScript, Mongoose, BullMQ |
| AI Service | Python, FastAPI, XGBoost, scikit-learn, SHAP |
| Database | MongoDB |
| Cache/Queue | Redis |
| Edge | Nginx, Docker |
| CI/CD | GitHub Actions |

**4.2** Important Module Code Snippets *(not full codebase)*  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.1 Authentication Service — JWT Issuance & Refresh Rotation  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.2 API Key Authentication Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.3 Risk Evaluation Controller & Service Orchestration  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.4 Feature Pipeline (`feature_pipeline.py`)  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.5 Inference Service (`inference_service.py`)  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.6 SHAP Explanation Generator  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.7 Webhook HMAC Signing & Delivery Worker  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.8 COD Verification Service (Twilio + OpenAI Agent)  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.9 Bulk Prediction Job Processor  
&nbsp;&nbsp;&nbsp;&nbsp;4.2.10 Frontend Risk Evaluation Form Component  

**4.3** Comments and Description  
&nbsp;&nbsp;&nbsp;&nbsp;4.3.1 Code Documentation Standards  
&nbsp;&nbsp;&nbsp;&nbsp;4.3.2 Inline Comments for Business Logic  

**4.4** Standardization of Coding / Code Efficiency  
&nbsp;&nbsp;&nbsp;&nbsp;4.4.1 TypeScript Strict Mode & ESLint  
&nbsp;&nbsp;&nbsp;&nbsp;4.4.2 Repository Pattern for Data Access  
&nbsp;&nbsp;&nbsp;&nbsp;4.4.3 Async/Await & Connection Pooling  
&nbsp;&nbsp;&nbsp;&nbsp;4.4.4 Caching Strategy (Redis)  

**4.5** Error Handling  
&nbsp;&nbsp;&nbsp;&nbsp;4.5.1 Centralized Error Handler Middleware  
&nbsp;&nbsp;&nbsp;&nbsp;4.5.2 Structured Error Response Format  
&nbsp;&nbsp;&nbsp;&nbsp;4.5.3 Graceful Shutdown (SIGTERM/SIGINT)  

**4.6** Parameters Calling / Passing  
&nbsp;&nbsp;&nbsp;&nbsp;4.6.1 Backend → AI Service Internal API Contract  
&nbsp;&nbsp;&nbsp;&nbsp;4.6.2 Request/Response DTOs (Zod + Pydantic Schemas)  

**4.7** Validation Checks  
&nbsp;&nbsp;&nbsp;&nbsp;4.7.1 Pincode Format Validation (`^\d{6}$`)  
&nbsp;&nbsp;&nbsp;&nbsp;4.7.2 COD Amount Conditional Validation  
&nbsp;&nbsp;&nbsp;&nbsp;4.7.3 API Key Scope Enforcement  
&nbsp;&nbsp;&nbsp;&nbsp;4.7.4 CSV Upload Validation (Bulk Predictions & Training Data)  

---

### CHAPTER 5 — TESTING

**5.1** Testing Techniques and Strategies Used  
&nbsp;&nbsp;&nbsp;&nbsp;5.1.1 Test Pyramid (Unit → Integration → E2E)  
&nbsp;&nbsp;&nbsp;&nbsp;5.1.2 Backend Unit Tests (Jest + MongoMemoryServer)  
&nbsp;&nbsp;&nbsp;&nbsp;5.1.3 AI Service Tests (Feature Pipeline pytest)  
&nbsp;&nbsp;&nbsp;&nbsp;5.1.4 CI Pipeline Automated Testing (GitHub Actions)  

**5.2** Test Case Design  

| Test ID | Module | Test Case | Expected Result |
|---------|--------|-----------|-----------------|
| TC-01 | Auth | Valid login with correct credentials | JWT cookies issued, 200 OK |
| TC-02 | Auth | Login with wrong password (5 attempts) | Account locked, 423 Locked |
| TC-03 | Public API | Risk evaluate with valid pincode | riskLevel returned with SHAP |
| TC-04 | Public API | Invalid pincode format | 400 Validation Error |
| TC-05 | Public API | Missing API key | 401 Unauthorized |
| TC-06 | Public API | Rate limit exceeded | 429 Too Many Requests |
| TC-07 | Dashboard | Analyst evaluates shipment | Prediction saved to history |
| TC-08 | API Keys | Org Admin creates API key | Key returned once, stored hashed |
| TC-09 | COD Verify | MEDIUM+ risk COD order | WhatsApp session initiated |
| TC-10 | Bulk Predict | CSV upload with 100 rows | Async job completes with results |
| TC-11 | ML Pipeline | Feature pipeline transform | Correct feature vector shape |
| TC-12 | Webhooks | Event delivery | HMAC-signed POST to endpoint |
| TC-13 | Admin | Suspend organization | Tenant API access blocked |
| TC-14 | Health | Deep health check | MongoDB + Redis + AI service UP |

**5.3** Test Reports  
&nbsp;&nbsp;&nbsp;&nbsp;5.3.1 Unit Test Execution Summary  
&nbsp;&nbsp;&nbsp;&nbsp;5.3.2 API Integration Test Results  
&nbsp;&nbsp;&nbsp;&nbsp;5.3.3 ML Model Evaluation Metrics (Precision, Recall, F1, AUC)  

**5.4** Debugging and Code Improvement  
&nbsp;&nbsp;&nbsp;&nbsp;5.4.1 Issues Identified During Testing  
&nbsp;&nbsp;&nbsp;&nbsp;5.4.2 Resolutions and Refactoring Done  

---

### CHAPTER 6 — SYSTEM SECURITY MEASURES

**6.1** Application Security  
&nbsp;&nbsp;&nbsp;&nbsp;6.1.1 Helmet.js Security Headers & CSP  
&nbsp;&nbsp;&nbsp;&nbsp;6.1.2 CORS Policy Configuration  
&nbsp;&nbsp;&nbsp;&nbsp;6.1.3 Input Sanitization (MongoDB Injection Prevention)  
&nbsp;&nbsp;&nbsp;&nbsp;6.1.4 Rate Limiting (Redis-backed, Per-Plan Quotas)  

**6.2** Authentication & Authorization Security  
&nbsp;&nbsp;&nbsp;&nbsp;6.2.1 JWT Best Practices (httpOnly Cookies, Short Access TTL)  
&nbsp;&nbsp;&nbsp;&nbsp;6.2.2 Refresh Token Rotation & Reuse Detection  
&nbsp;&nbsp;&nbsp;&nbsp;6.2.3 Account Lockout After Failed Attempts  
&nbsp;&nbsp;&nbsp;&nbsp;6.2.4 API Key Hashing (Never Store Plaintext Keys)  
&nbsp;&nbsp;&nbsp;&nbsp;6.2.5 RBAC — Role Definitions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A. SUPER_ADMIN  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B. ORGANIZATION_ADMIN  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C. ANALYST  

**6.3** Database / Data Security  
&nbsp;&nbsp;&nbsp;&nbsp;6.3.1 Multi-Tenant Data Isolation at Repository Layer  
&nbsp;&nbsp;&nbsp;&nbsp;6.3.2 Password Hashing (bcrypt, cost factor 12)  
&nbsp;&nbsp;&nbsp;&nbsp;6.3.3 Training Data Privacy (PII Stripping)  
&nbsp;&nbsp;&nbsp;&nbsp;6.3.4 Webhook HMAC Signature Verification  

**6.4** Creation of User Profiles and Access Rights  
&nbsp;&nbsp;&nbsp;&nbsp;6.4.1 Customer Portal vs Admin Portal Separation  
&nbsp;&nbsp;&nbsp;&nbsp;6.4.2 API Key Scopes (`pincode:read`, `courier:read`, prediction scopes)  
&nbsp;&nbsp;&nbsp;&nbsp;6.4.3 Organization Suspension & Access Revocation  

**6.5** Network & Infrastructure Security  
&nbsp;&nbsp;&nbsp;&nbsp;6.5.1 TLS Termination via Nginx  
&nbsp;&nbsp;&nbsp;&nbsp;6.5.2 AI Service Internal-Only Access (No Direct Frontend Calls)  
&nbsp;&nbsp;&nbsp;&nbsp;6.5.3 Environment Variable & Secrets Management  

---

### CHAPTER 7 — COST ESTIMATION OF THE PROJECT

**7.1** Development Cost  
&nbsp;&nbsp;&nbsp;&nbsp;7.1.1 Hardware Cost (Development Machines)  
&nbsp;&nbsp;&nbsp;&nbsp;7.1.2 Software & Tools (Free/Open Source Stack)  
&nbsp;&nbsp;&nbsp;&nbsp;7.1.3 Human Resource Cost (Team Members × Duration)  

**7.2** Deployment / Operational Cost (Monthly Estimate)  

| Component | Service | Estimated Cost |
|-----------|---------|----------------|
| Compute | Cloud VM / Docker Host | ₹X,XXX |
| Database | MongoDB Atlas | ₹X,XXX |
| Cache | Redis Cloud | ₹XXX |
| Email | SMTP (SendGrid/SES) | ₹XXX |
| WhatsApp | Twilio API | ₹X,XXX |
| AI Agent | OpenAI API | ₹X,XXX |
| Domain & SSL | Domain + Let's Encrypt | ₹XXX |
| **Total** | | **₹XX,XXX/month** |

**7.3** Cost-Benefit Analysis for Logistics Companies  

---

### CHAPTER 8 — REPORTS

**8.1** System-Generated Reports & Dashboards  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.1 Prediction History Report  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.2 API Usage & Quota Report (`/app/usage`)  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.3 Pincode Performance Intelligence Report  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.4 Courier Performance Report  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.5 Bulk Prediction Job Result Export (CSV)  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.6 Admin Platform Statistics Report  
&nbsp;&nbsp;&nbsp;&nbsp;8.1.7 ML Model Training Metrics Report  

**8.2** Sample Report Layouts *(screenshots in report)*  
&nbsp;&nbsp;&nbsp;&nbsp;8.2.1 Risk Evaluation Result with SHAP Explanations  
&nbsp;&nbsp;&nbsp;&nbsp;8.2.2 Prediction Detail Page  
&nbsp;&nbsp;&nbsp;&nbsp;8.2.3 Usage Dashboard  
&nbsp;&nbsp;&nbsp;&nbsp;8.2.4 COD Verification Status Report  
&nbsp;&nbsp;&nbsp;&nbsp;8.2.5 Admin Organization Management View  

**8.3** Project Management Charts  
&nbsp;&nbsp;&nbsp;&nbsp;8.3.1 Gantt Chart — Development Timeline  
&nbsp;&nbsp;&nbsp;&nbsp;8.3.2 PERT Chart — Critical Path Analysis  

---

### CHAPTER 9 — CONCLUSION AND RECOMMENDATIONS

**9.1** Conclusion  
&nbsp;&nbsp;&nbsp;&nbsp;9.1.1 Summary of Work Accomplished  
&nbsp;&nbsp;&nbsp;&nbsp;9.1.2 Achievement of Project Objectives  
&nbsp;&nbsp;&nbsp;&nbsp;9.1.3 Significance of PredixRoute for Logistics Industry  
&nbsp;&nbsp;&nbsp;&nbsp;9.1.4 Limitations Encountered  

**9.2** Recommendations / Future Scope  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.1 Analytics Dashboards & PDF Report Generation  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.2 TypeScript & Python Public SDKs  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.3 Per-Organization Custom Model Training  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.4 Real-Time NDR Workflow Integration  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.5 AWS/GCP Secrets Manager Integration  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.6 Production TLS & WAF Hardening  
&nbsp;&nbsp;&nbsp;&nbsp;9.2.7 Mobile Application for Field Operations  

---

### CHAPTER 10 — REFERENCES

*Arranged alphabetically by author name or serially as per guide instructions.*

1. Express.js Documentation; Node.js Web Framework; https://expressjs.com  
2. FastAPI Documentation; Python Web Framework for APIs; https://fastapi.tiangolo.com  
3. Chen, T. and Guestrin, C.; XGBoost: A Scalable Tree Boosting System; KDD, 2016.  
4. Lundberg, S.M. and Lee, S.I.; A Unified Approach to Interpreting Model Predictions (SHAP); NeurIPS, 2017.  
5. MongoDB Inc.; MongoDB Manual — Multi-Tenant Data Architecture; docs.mongodb.com  
6. OWASP Foundation; OWASP Top Ten Web Application Security Risks; owasp.org  
7. Pedregosa, F. et al.; Scikit-learn: Machine Learning in Python; JMLR, 2011.  
8. React Documentation; Meta Open Source; react.dev  
9. Redis Ltd.; Redis Documentation — Caching and Message Queues; redis.io  
10. Fielding, R.T.; Architectural Styles and the Design of Network-based Software Architectures; Doctoral Dissertation, UC Irvine, 2000.  

---

## Appendices

**Appendix A** — Software Requirement Specification (Full SRS Document)  
**Appendix B** — OpenAPI Public API Specification (`public-api.yaml`)  
**Appendix C** — Database Collection Schemas  
**Appendix D** — Sample API Request/Response Payloads  
**Appendix E** — ML Training CSV Template & Column Mapping  
**Appendix F** — User Manual — Customer Portal Screenshots  
**Appendix G** — User Manual — Admin Console Screenshots  
**Appendix H** — Test Case Sheets (Detailed)  
**Appendix I** — Source Code Listing — Key Modules Only  
**Appendix J** — Environment Configuration (`.env.example` reference)  
**Appendix K** — Glossary of Logistics Terms (RTO, NDR, COD, MIS, AWB)  

*Appendices: Times New Roman, font size 10*

---

## List of Tables

| Table No. | Title | Page |
|-----------|-------|------|
| Table 1.1 | Comparison of Existing Logistics Risk Solutions | |
| Table 2.1 | Functional Requirements Summary | |
| Table 2.2 | Non-Functional Requirements | |
| Table 2.3 | Hardware Requirements | |
| Table 2.4 | Software Requirements | |
| Table 2.5 | Project Milestones | |
| Table 3.1 | MongoDB Collections and Relationships | |
| Table 3.2 | Redis Key Patterns | |
| Table 3.3 | RBAC Permission Matrix | |
| Table 3.4 | ML Feature Vector Description | |
| Table 3.5 | Risk Level Classification Thresholds | |
| Table 4.1 | Technology Stack Summary | |
| Table 5.1 | Test Case Summary | |
| Table 5.2 | ML Model Evaluation Metrics | |
| Table 6.1 | Security Layers and Implementations | |
| Table 6.2 | User Roles and Access Rights | |
| Table 7.1 | Development Cost Breakdown | |
| Table 7.2 | Monthly Operational Cost Estimate | |
| Table 8.1 | System-Generated Report Types | |

---

## List of Figures

| Figure No. | Title | Page |
|------------|-------|------|
| Figure 2.1 | PredixRoute System Context Diagram (C4) | |
| Figure 2.2 | High-Level Service Architecture | |
| Figure 2.3 | Use Case Diagram — Customer Portal | |
| Figure 2.4 | Use Case Diagram — Platform Admin | |
| Figure 2.5 | Use Case Diagram — Public API Integrator | |
| Figure 2.6 | Data Flow Diagram — Level 0 | |
| Figure 2.7 | Data Flow Diagram — Risk Evaluation (Level 1) | |
| Figure 2.8 | Entity Relationship Diagram (MongoDB) | |
| Figure 2.9 | Class Diagram — Backend Domain Layer | |
| Figure 2.10 | Class Diagram — AI Service ML Pipeline | |
| Figure 2.11 | Sequence Diagram — User Registration | |
| Figure 2.12 | Sequence Diagram — JWT Login & Refresh | |
| Figure 2.13 | Sequence Diagram — Public Risk Evaluation | |
| Figure 2.14 | Sequence Diagram — COD WhatsApp Verification | |
| Figure 2.15 | Sequence Diagram — Bulk Prediction Job | |
| Figure 2.16 | Sequence Diagram — Model Training Pipeline | |
| Figure 2.17 | Activity Diagram — Shipment Risk Assessment | |
| Figure 2.18 | State Diagram — COD Verification Session | |
| Figure 2.19 | Component Diagram — Monorepo Topology | |
| Figure 2.20 | Deployment Diagram — Docker Production Stack | |
| Figure 2.21 | Gantt Chart — Project Schedule | |
| Figure 2.22 | PERT Chart — Critical Path | |
| Figure 3.1 | Customer Dashboard — Risk Evaluation Screen | |
| Figure 3.2 | Prediction Detail with SHAP Explanations | |
| Figure 3.3 | Pincode Intelligence Table UI | |
| Figure 3.4 | API Key Management Screen | |
| Figure 3.5 | Admin Console — Organization Management | |
| Figure 3.6 | Admin Console — Model Training Page | |
| Figure 3.7 | Marketing Website — Home Page | |
| Figure 3.8 | Developer Portal — API Documentation | |
| Figure 8.1 | Sample Risk Evaluation Report Layout | |
| Figure 8.2 | API Usage Dashboard Report | |
| Figure 8.3 | Bulk Prediction Results Export | |

---

## Abstract — Writing Guide (250–350 words)

Write the abstract in **250–350 words** covering the following blocks in a concise, informative format:

| Block | What to Write (PredixRoute-specific) |
|-------|--------------------------------------|
| **Opening** | PredixRoute is an AI-powered, multi-tenant logistics intelligence platform that helps e-commerce sellers, logistics companies, and OMS/ERP systems predict shipment delivery risk before dispatch. |
| **Problem** | High RTO rates, especially on COD orders; lack of explainable pre-dispatch intelligence; fragmented courier/pincode performance data. |
| **Solution** | Three-tier monorepo: React dashboard, Node.js API gateway, internal FastAPI ML service (XGBoost + SHAP). |
| **Methods** | Feature engineering from pincode/courier/shipment data; stratified train/test split; model selection by F1; REST API + webhooks for integration. |
| **Key Features** | Risk scoring (LOW→CRITICAL), courier recommendation, pincode/courier intelligence, API keys with quotas, COD WhatsApp verification (Twilio + OpenAI), bulk CSV predictions, admin model training. |
| **Security** | JWT + RBAC, API key hashing, tenant isolation, rate limiting, HMAC webhooks. |
| **Results** | Working SaaS with dashboard, public API, explainable predictions, background job processing; unit tests in CI. |
| **Conclusion (2–3 lines)** | Reduces pre-dispatch RTO exposure; scalable API-first design; future scope: SDKs, analytics PDFs, per-org models. |

### Sample Abstract (Draft — customize names/dates)

PredixRoute is an AI-powered logistics intelligence platform designed to help e-commerce sellers, logistics companies, and order management systems make informed shipping decisions before dispatch. The Indian e-commerce logistics sector faces persistently high Return-to-Origin (RTO) rates, particularly for Cash-on-Delivery (COD) shipments, resulting in significant financial losses and operational inefficiencies. Existing courier selection and risk assessment approaches rely largely on manual judgment or opaque aggregator scores, lacking explainable, data-driven pre-dispatch intelligence.

This project addresses these challenges by developing a multi-tenant Software-as-a-Service (SaaS) platform with a RESTful public API. The system follows a three-tier monorepo architecture comprising a React-based customer dashboard, a Node.js Express API gateway, and an internal Python FastAPI machine learning service. Shipment risk is predicted using an XGBoost classifier trained on historical logistics MIS data, with SHAP (SHapley Additive exPlanations) providing transparent feature-level explanations for each prediction. The platform additionally offers courier recommendation, pincode and courier performance intelligence, API key management with usage quotas, webhook-based event notifications, bulk CSV prediction processing via background job queues, and COD order verification through WhatsApp using Twilio and an OpenAI conversational agent.

Security is enforced through JSON Web Token (JWT) authentication with refresh token rotation, Role-Based Access Control (RBAC), bcrypt password hashing, API key hashing, multi-tenant data isolation, and Redis-backed rate limiting. The system was developed iteratively using an agile slice-based methodology and validated through unit tests on critical backend services and the ML feature pipeline, integrated into a continuous integration pipeline.

PredixRoute successfully demonstrates that explainable machine learning can be integrated into production-grade logistics API infrastructure. The platform enables merchants to gate high-risk COD shipments, select optimal couriers, and integrate risk intelligence into existing OMS workflows. Future enhancements include public SDKs, analytics dashboards with PDF reporting, and per-organization custom model training.

---

## List of Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| API | Application Programming Interface |
| AWB | Air Waybill Number |
| COD | Cash on Delivery |
| CSP | Content Security Policy |
| DFD | Data Flow Diagram |
| ERD | Entity Relationship Diagram |
| HMAC | Hash-based Message Authentication Code |
| JWT | JSON Web Token |
| MIS | Management Information System |
| ML | Machine Learning |
| MUI | Material UI |
| NDR | Non-Delivery Report |
| OMS | Order Management System |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| RTO | Return to Origin |
| SaaS | Software as a Service |
| SHAP | SHapley Additive exPlanations |
| SRS | Software Requirement Specification |
| TTL | Time To Live |
| UI | User Interface |
| WMS | Warehouse Management System |
| XGBoost | eXtreme Gradient Boosting |

---

## Formatting Reminders

| Element | Rule |
|---------|------|
| Chapter headings | **CENTER, ALL CAPS** — e.g., **CHAPTER 1 — INTRODUCTION** |
| Headings / subheadings | Left-aligned, numbered **x.y.z** |
| Paragraphs | Start on the line **after** each heading |
| References in text | Author name or serial number [1], [2] |
| Appendices | Times New Roman, **10pt** |
| Figures & tables | Numbered by chapter (e.g., Figure 2.1, Table 3.2) |

---

## Reference Citation Format Examples

**For Journals:**

Kerr, G.T.; Chemistry of Crystalline Aluminositicate; The J. Phy. Chem., April 1968, vol.73, no.3, pp.1385-1386.

Garside, J. et al.; Industrial crystallization from solution; Chem. Engg. Sci., 1985, vol. 40, no.2, pp.3-26.

**For Books:**

MeCabe and Smith; Unit Operations in Chemical Engg., 4th ed., TMH, pp.812-814.

---

*Document generated for PredixRoute Final Year Project Report. Align chapter content with supervisor guidelines before submission.*
