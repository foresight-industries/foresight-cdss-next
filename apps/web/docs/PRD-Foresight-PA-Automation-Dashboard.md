# Product Requirements Document (PRD)
# Foresight RCM Dashboard

## 1. Executive Summary

### Product Overview
The Foresight RCM Dashboard is a comprehensive web-based platform designed to streamline and automate the RCM and Prior Authorization (PA) process for GLP-1 medications. The system leverages AI/ML capabilities, OCR technology, and intelligent workflow automation to reduce manual PA processing from hours to minutes while maintaining high accuracy and compliance standards.

### Key Value Propositions
- **87% Full Automation Rate**: The majority of PAs processed without human intervention
- **2.4-minute Average Processing Time**: Down from traditional 30-60 minute manual processes
- **96.2% Field Accuracy**: High-confidence automated data extraction and form filling
- **Real-time Status Synchronization**: Webhook-based updates with <2 hour latency
- **Zero Duplicate Prevention**: Idempotency key implementation ensures data integrity

### Target Users
- **Primary**: PA Coordinators managing high-volume prior authorization requests
- **Secondary**: Healthcare providers, practice managers, and administrative staff
- **Tertiary**: Patients benefiting from faster medication approval processes

## 2. Business Context

### Problem Statement
Current prior authorization processes are manual, time-consuming, and error-prone:
- Manual form filling takes 30-60 minutes per PA
- High rate of denials due to incomplete or incorrect information
- Lack of visibility into PA status and processing times
- No intelligent routing or automated retry logic for denials
- Limited analytics and predictive capabilities

### Business Goals
1. **Efficiency**: Reduce PA processing time by 90% through automation
2. **Accuracy**: Achieve >95% field accuracy in automated form filling
3. **Scale**: Handle 1000+ concurrent PAs without performance degradation
4. **Intelligence**: Implement predictive analytics for PA success rates
5. **Compliance**: Maintain full audit trail and HIPAA compliance

### Success Metrics
- Full automation rate ≥ 70% (currently achieving 87%)
- Average processing time ≤ 6 minutes at P95 (currently 2.4 min average)
- Field accuracy ≥ 95% (currently 96.2%)
- Status sync latency ≤ 4 hours (currently 1.8 hours)
- User satisfaction score ≥ 4.5/5.0

## 3. Feature Requirements

### 3.1 Core Dashboard Features

#### 3.1.1 Real-time Metrics Dashboard
**Description**: Live monitoring of system performance and PA processing metrics

**Key Metrics**:
- Active PAs count with trend indicators
- Full automation rate percentage
- Average processing time
- Field accuracy percentage
- LLM confidence scores
- Status synchronization latency
- Duplicate prevention rate

**Requirements**:
- Auto-refresh every 30 seconds
- Visual indicators for metric changes (up/down arrows)
- Color coding for performance thresholds
- Drill-down capability for detailed analysis

#### 3.1.2 PA Status Distribution
**Description**: Visual representation of current PA statuses across the system

**Status Categories**:
- Needs Review (Manual intervention required)
- Auto-Processing (Currently being automated)
- Auto-Approved (Successfully automated approval)
- Denied (Rejected by payer)
- Error States (OCR failures, missing data)

**Requirements**:
- Horizontal progress bars showing distribution
- Click-through to filtered queue views
- Real-time updates via webhooks
- Historical trend comparison

### 3.2 ePA Queue Management

#### 3.2.1 Intelligent ePA Queue
**Description**: Comprehensive list view of all PAs with smart filtering and search

**Core Fields**:
- Case ID (clickable for detail view)
- Patient Information (Name, ID, Conditions)
- PA Attempt Number and Medication Sequence
- Payer Information
- Current Status with badges
- AI Confidence Score with visual indicator
- Denial Reasons (if applicable)
- Timestamps (Created, Updated)
- Quick Actions

**Advanced Features**:
- Real-time search across all fields
- Multi-criteria filtering
- Bulk selection and operations
- Export capabilities
- Customizable column views
- Pagination with configurable page sizes

#### 3.2.2 PA Attempt Intelligence
**Description**: Smart tracking of PA attempts with automated sequencing

**Logic**:
- Maximum 3 attempts per patient (configurable)
- Automated medication sequencing based on:
  - Patient conditions (T2D priority list)
  - Payer preferences
  - Previous denial reasons
- Visual indicators for attempt number
- Clear next-step guidance

### 3.3 Automation Engine

#### 3.3.1 Insurance Card OCR
**Description**: Automated extraction of insurance information using Gemini 2.5 Flash

**Extracted Fields**:
- Member Name and ID
- Group Number
- Plan Information
- RxBIN, PCN, Group
- Copay Details
- Phone Numbers

**Requirements**:
- Automatic retry on OCR failure
- Manual upload request workflow
- Confidence scoring per field
- Validation against known patterns

#### 3.3.2 Clinical Question Automation
**Description**: AI-powered answering of clinical assessment questions

**Capabilities**:
- Rules engine for deterministic questions
- LLM integration for complex clinical queries
- Confidence scoring per answer
- Source attribution from clinical notes
- Override capability with audit trail

#### 3.3.3 Document Intelligence
**Description**: Automated attachment of relevant clinical documents

**Features**:
- Smart document selection based on PA requirements
- Auto-attachment of clinical notes
- Lab result prioritization
- Document validation and completeness checks

### 3.4 PA Detail View

#### 3.4.1 Comprehensive Case Overview
**Description**: Detailed single PA view with all relevant information

**Sections**:
- Case header with status and actions
- Patient demographics and clinical data
- Current PA attempt details
- Insurance information with OCR status
- Provider and prescription information
- Complete automation timeline
- Performance metrics sidebar

#### 3.4.2 Automation Timeline
**Description**: Visual representation of PA processing steps

**Timeline Events**:
- PA initiation
- Field population
- Clinical question answering
- Document attachment
- Submission to payer
- Status updates
- Approval/denial handling

**For Each Event**:
- Timestamp
- Description
- Confidence score (where applicable)
- Status indicator (completed/in-progress/pending)

### 3.5 Analytics and Insights

#### 3.5.1 Predictive Analytics
**Description**: ML-based prediction of PA success rates

**Factors Considered**:
- Patient profile and conditions
- Payer historical approval rates
- Medication selection
- Clinical documentation completeness
- Time of submission patterns

**Output**:
- Success probability percentage
- Recommended optimizations
- Alternative medication suggestions

#### 3.5.2 Performance Analytics
**Description**: Comprehensive analytics dashboards

**Key Charts**:
- Approval rates by payer
- Processing time trends
- Denial reason analysis
- Automation rate over time
- Peak processing hours
- Success rate by medication

### 3.6 Bulk Operations (Phase 2)

#### 3.6.1 Batch Processing
**Description**: Handle multiple PAs simultaneously

**Capabilities**:
- Select multiple PAs for bulk actions
- Bulk status checking
- Mass document uploads
- Batch exports
- Bulk reassignment

## 4. Technical Requirements

### 4.1 Architecture

#### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS for consistent design system
- **State Management**: React Query for server state, Zustand for client state
- **UI Components**: Shadcn/ui component library
- **Real-time Updates**: WebSocket connection for live updates

#### Backend Integration
- **API**: RESTful API with webhook support
- **Authentication**: JWT-based auth with role-based access
- **Real-time**: WebSocket for live dashboard updates
- **Queue Management**: Redis for job queuing
- **ML/AI Services**: 
  - Gemini 2.5 Flash for OCR
  - Custom LLM integration for clinical questions
  - ML models for predictive analytics

### 4.2 Data Models

#### PA Case Model
```typescript
interface PACase {
  id: string;
  patientId: string;
  attemptNumber: number;
  maxAttempts: number;
  medication: Medication;
  medicationSequence: string[];
  status: PAStatus;
  automationScore: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date;
  denialReasons?: string[];
}
```

#### Patient Model
```typescript
interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  conditions: string[];
  bmi: number;
  hasType2Diabetes: boolean;
  insurance: Insurance;
}
```

#### Automation Event Model
```typescript
interface AutomationEvent {
  id: string;
  caseId: string;
  type: EventType;
  timestamp: Date;
  status: 'completed' | 'in_progress' | 'pending' | 'error';
  confidence?: number;
  details: Record<string, any>;
}
```

### 4.3 Performance Requirements

- **Page Load Time**: < 2 seconds for dashboard
- **Real-time Updates**: < 500ms latency for status changes
- **Search Response**: < 200ms for queue searches
- **Concurrent Users**: Support 100+ simultaneous users
- **API Response Time**: P95 < 300ms for all endpoints
- **Uptime**: 99.9% availability

### 4.4 Security & Compliance

- **HIPAA Compliance**: Full PHI protection
- **Encryption**: TLS 1.3 for transit, AES-256 for storage
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete trail of all actions
- **Data Retention**: Configurable retention policies
- **Session Management**: Secure session handling with timeout

## 5. User Experience Requirements

### 5.1 Design Principles

1. **Clarity**: Information hierarchy with clear visual indicators
2. **Efficiency**: Minimal clicks to complete common tasks
3. **Consistency**: Unified design language across all screens
4. **Responsiveness**: Optimized for desktop with tablet support
5. **Accessibility**: WCAG 2.1 AA compliance

### 5.2 Navigation Structure

```
Main Navigation:
├── Dashboard (Default view with key metrics)
├── PA Queue (Main working area)
├── Analytics (Insights and trends)
├── Bulk Operations (Phase 2)
└── Settings (User preferences, system config)

Secondary Navigation:
├── PA Detail (Accessible from queue/dashboard)
├── Patient History
├── Payer Profiles
└── Export Center
```

### 5.3 Key User Workflows

#### Workflow 1: Monitor Automated PAs
1. View dashboard for system health
2. Check automation rate and processing times
3. Identify any PAs needing review
4. Click through to detailed view if needed

#### Workflow 2: Handle Manual Review
1. Filter queue for "Needs Review" status
2. Open PA detail view
3. Review automation confidence scores
4. Override or confirm automated decisions
5. Submit for processing

#### Workflow 3: Manage Denials
1. Filter for denied PAs
2. Review denial reasons
3. System auto-suggests next medication
4. Confirm or override sequence
5. Auto-initiate new PA attempt

## 6. Integration Requirements

### 6.1 External Systems

1. **CMM API**
   - Case creation with idempotency keys
   - Real-time status webhooks
   - Document upload endpoints
   - Bulk operations support

2. **Dosespot Integration**
   - Draft prescription creation
   - Prescription release on approval
   - Medication history access

3. **OCR Service (Gemini 2.5 Flash)**
   - Insurance card processing
   - Confidence scoring
   - Field extraction with validation

4. **Clinical Notes System**
   - PDF retrieval
   - Metadata access
   - Search capabilities

### 6.2 Webhook Requirements

- **Endpoint Security**: HMAC signature verification
- **Retry Logic**: Exponential backoff with max 5 retries
- **Event Types**:
  - PA status changes
  - Approval notifications
  - Denial with reasons
  - Document requests
- **Payload Format**: JSON with standardized schema

## 7. Phase 2 Enhancements

### 7.1 Advanced Analytics
- Cohort analysis for patient outcomes
- Payer negotiation insights
- Cost savings calculator
- Medication efficacy tracking

### 7.2 AI Improvements
- Continuous learning from approvals/denials
- Natural language PA note generation
- Automated appeal letter drafting
- Proactive denial prevention

### 7.3 Workflow Automation
- Configurable automation rules
- Custom PA sequences by condition
- Automated follow-up scheduling
- Integration with patient communication

## 8. Success Criteria

### Launch Criteria
- [ ] 95% automation accuracy in testing
- [ ] <3 minute average processing time
- [ ] Zero critical bugs in UAT
- [ ] 100% webhook reliability
- [ ] Complete audit trail functionality

### Post-Launch Metrics (30 days)
- [ ] 70%+ full automation rate achieved
- [ ] <5% error rate requiring manual intervention
- [ ] 90%+ user satisfaction score
- [ ] 50% reduction in average PA completion time
- [ ] Zero security incidents

## 9. Timeline

### Phase 1: MVP (Weeks 1-8)
- Week 1-2: Technical architecture and setup
- Week 3-4: Core dashboard and queue implementation
- Week 5-6: Automation engine integration
- Week 7-8: Testing, optimization, and deployment

### Phase 2: Enhancements (Weeks 9-16)
- Week 9-10: Advanced analytics
- Week 11-12: Bulk operations
- Week 13-14: AI improvements
- Week 15-16: Additional integrations

## 10. Risks and Mitigations

### Technical Risks
1. **OCR Accuracy**: Mitigated by confidence scoring and manual fallback
2. **API Latency**: Mitigated by caching and webhook architecture
3. **Scale**: Mitigated by horizontal scaling and queue management

### Business Risks
1. **User Adoption**: Mitigated by intuitive UI and training
2. **Payer Changes**: Mitigated by configurable rule engine
3. **Regulatory**: Mitigated by compliance-first design

## 11. Appendices

### A. Glossary
- **PA**: Prior Authorization
- **GLP-1**: Glucagon-like peptide-1 receptor agonists
- **CMM**: Cover My Meds (PA platform)
- **T2D**: Type 2 Diabetes
- **OCR**: Optical Character Recognition
- **LLM**: Large Language Model

### B. References
- CMM API Documentation
- HIPAA Compliance Guidelines
- Payer-specific PA requirements
- Clinical documentation standards
