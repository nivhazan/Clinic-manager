Speech Therapy Clinic Management System – Detailed Product Specification
🎯 Overview

A comprehensive management system for a private speech therapy clinic, designed specifically for speech-language pathologists.
The system provides a fully Hebrew RTL interface and includes complete tools for managing patients, appointments, therapy sessions, payments, expenses, tasks, and reports.

The goal is to streamline both clinical and business workflows in one professional, easy-to-use system.

📱 Screens & Core Features
1️⃣ Dashboard

Purpose: Provide a high-level overview of the clinic’s current status.

Components:

Statistics Cards:

Number of active patients

Appointments this week

Monthly income

Pending tasks

Upcoming Appointments:

List of upcoming sessions including patient name, time, and session type

Recent Sessions:

History of recently documented therapy sessions

Reminders & Tasks:

Urgent tasks and upcoming appointment reminders

2️⃣ Calendar (Appointments)

Purpose: Full appointment scheduling and calendar management.

Views:

Monthly view – overview of all appointments in a month

Weekly view – 7-day overview

Daily view – detailed hourly schedule

Functions:

Create New Appointment:

Select patient from list or create a new patient

Date and time

Session duration (default: 45 minutes)

Session type:

Initial assessment

Ongoing therapy

Follow-up

Consultation

Status:

Scheduled

Confirmed

Completed

Canceled

No-show

Notes

Edit Appointment:

Clicking an appointment opens full edit view

Mark as Paid:

Quick payment marking directly from the appointment

Automatically creates a payment record

Prompt for amount and payment method

Visual Indicators:

Different colors for appointment statuses

Paid/unpaid indicators

Monthly payment plan indicator

Alerts for completed but unpaid appointments

Delete Appointments

3️⃣ Payments

Purpose: Centralized financial management.

Tabs Structure:
A. Payments

Payment List Fields:

Patient name

Payment date

Amount

Payment method:

Cash

Bank transfer

Credit card

Check

Bit / PayBox

Payment type:

Session payment

Monthly payment

Notes

Manual Payment Entry:

Add payments not linked to a specific appointment

Edit & Delete Payments

Statistics:

Total monthly income

Total yearly income

Average payment amount

Breakdown by payment method

Unpaid Sessions Tracking:

List of completed but unpaid appointments

Mark as paid directly from the list

Total outstanding balance calculation

B. Payment Schedules

Recurring Payment Agreements:

Monthly / Weekly / Bi-weekly payments

Patient

Amount

Start and end dates

Next payment date

Payment method

Status:

Active

Paused

Completed

Canceled

Automatic Invoice Generation:

Optional automatic invoice creation when payment is due

Edit & Delete Payment Schedules

C. Invoices

Invoice Creation:

Auto-generated invoice number

Patient name

Issue date

Line items (description, quantity, unit price)

Subtotal

VAT

Total amount

Payment method

Payment status:

Paid

Pending

Partially paid

View & Export:

Print or save as PDF

Session Linking:

Ability to link invoices to specific appointments

4️⃣ Therapy Sessions Documentation

Purpose: Professional documentation of each therapy session.

Session Record Fields:

Basic Details:

Patient

Session date

Session number (auto-increment)

Linked appointment (if exists)

Session Content:

Session goals

Activities performed (detailed description)

Progress level:

Significant

Good

Moderate

Minimal

No change

Patient cooperation:

Excellent

Good

Fair

Limited

Summary & Planning:

Session summary

Home assignments

Plan for next session

Recommendations

Search & Filters:

By patient

By date

By progress level

Patient History View:

Full session history per patient

Edit & Delete Sessions

5️⃣ Expenses

Purpose: Business expense tracking for management and tax reporting.

Expense Entry:

Receipt Upload:

Manual upload (image or PDF)

AI-based receipt recognition extracting:

Amount

Vendor

Date

Description

Category

Expense Fields:

Date

Amount

Category:

Clinical equipment

Office supplies

Rent

Utilities

Internet & phone

Marketing & advertising

Training & courses

Insurance

Maintenance & repairs

Other

Vendor / business name

Description

Payment method

Notes

Tax deductible (checkbox)

Expense List:

Free-text search

Filter by category

Statistics:

Monthly expenses

Yearly expenses

Category breakdown

Export Options:

Weekly expenses – ZIP (receipts + CSV)

Monthly expenses – ZIP (receipts + CSV)

Yearly expenses – ZIP (receipts + CSV)

Receipt Download:

Single receipt or bulk download

Edit & Delete Expenses

6️⃣ Patients

Purpose: Complete patient record management.

Patient Details:

Personal Information:

Full name

ID number

Date of birth

Phone number

Parent phone (for minors)

Email

Address

Medical Information:

Initial diagnosis

Medical background

Referral source

Emergency contact + phone

Status:

Active

Inactive

Treatment completed

Recurring Appointments:

Fixed weekly day

Fixed time

Payment Details:

Payment frequency:

Per session

Monthly

Session price

Monthly price (if applicable)

General Notes

Additional Features:

Quick search by name

Filter by status

Patient Profile View:

Full personal details

Appointment history

Session history

Payment history

Attached documents

Edit & Delete Patients

7️⃣ Tasks

Purpose: Daily task and reminder management.

Task Fields:

Title

Description

Linked patient (optional)

Due date

Status:

To do

In progress

Completed

Priority:

High

Medium

Low

Functions:

Filter by status

Filter by priority

Sort by due date

One-click mark as completed

Edit & delete tasks

🎨 Design & User Experience

UI/UX:

Full RTL support (Hebrew-first)

Fully responsive (mobile & tablet friendly)

Pleasant color palette (blue, purple, green gradients)

Smooth screen transitions and animations

Icons using Lucide React

Navigation:

Fixed top bar with logo and logout

Main navigation menu for all screens

Breadcrumbs for clear location context

Indicators & Feedback:

Toast notifications (success, error, info)

Loading states and spinners

Colored status badges

Language & Localization Requirements:
- The entire application must be displayed in Hebrew by default.
- All UI text must be in Hebrew, including:
  - Labels
  - Buttons
  - Placeholders
  - Validation messages
  - Status values
  - Toast notifications
  - Empty states
  - Error messages
- No English text should appear in the UI.
- The application must use RTL layout across all screens.
- Text direction, alignment, and component behavior must be fully RTL-compliant.
- The system is not multilingual at this stage; Hebrew is the only supported language.


🔐 Security & Authentication

Secure authentication via Base44

Role-based permissions:

Only administrators can access all data

Cloud-based data storage with automatic backups

📊 Reports & Analytics

Financial analytics (income vs expenses)

Patient tracking (active vs completed)

Appointment analytics:

Cancellation rates

Attendance rates

Data export:

CSV for Excel

ZIP for receipts and documents

🚀 Technologies

React – UI framework

TailwindCSS – styling

Shadcn/UI – reusable components

Base44 SDK – data management and integrations

React Query – state management and caching

Lucide React – icons

date-fns – date handling

Sonner – toast notifications

AI integration – automatic receipt recognition

🎯 This is a full-scale, professional clinic management system designed to save time, improve organization, and enable precise tracking of all clinical and business operations.