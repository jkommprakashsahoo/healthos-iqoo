import React, { useEffect, useState } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { HomeScreen } from './components/HomeScreen';
import { TimelineScreen } from './components/TimelineScreen';
import { AskAIScreen } from './components/AskAIScreen';
import { RecordsScreen } from './components/RecordsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { DoctorPrepScreen } from './components/DoctorPrepScreen';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { TimelineEventSheet } from './components/TimelineEventSheet';
import { ShareSheetModal } from './components/ShareSheetModal';
import { UploadFlowModal } from './components/UploadFlowModal';
import { AddAppointmentModal, NewAppointmentInput } from './components/AddAppointmentModal';
import { supabase, getStoredAppointments, saveStoredAppointment } from './lib/supabase';

import { TimelineEvent, HealthDocument, DoctorAppointment } from './types';
import { PatientProfile } from './types';

interface AppProps {
  patient: PatientProfile;
}

const emptyDoctorBriefing = {
  whyImHere: 'Upload records to prepare a doctor briefing.',
  recentChanges: [],
  currentMedications: [],
  relevantHistory: [],
  recentReports: [],
  questionsToAsk: [],
  conciseSummary60s: 'No health records have been uploaded yet.',
};

const formatDisplayDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatMonthGroup = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

export function App({ patient }: AppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [doctorBriefing] = useState(emptyDoctorBriefing);

  // Modals & Sub-screen state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<HealthDocument | null>(null);
  const [isDoctorPrepOpen, setIsDoctorPrepOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isUploadFlowOpen, setIsUploadFlowOpen] = useState(false);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);

  // AI Prompt routing state
  const [aiQuestionPrompt, setAiQuestionPrompt] = useState<string | undefined>(undefined);
  const [aiActionType, setAiActionType] = useState<
    'what_changed' | 'previous_episodes' | 'doctor_prep' | 'summary' | 'custom' | undefined
  >(undefined);

  // Load any previously saved appointments from Supabase on mount
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      try {
        const rows = await getStoredAppointments(userData.user.id);
        if (cancelled) return;
        setAppointments(
          rows.map((row) => ({
            id: row.id,
            doctorName: row.doctor_name,
            specialty: row.specialty,
            isoDate: row.iso_date,
            date: formatDisplayDate(row.iso_date),
            time: row.time,
            location: row.location,
            notes: row.notes,
          }))
        );
      } catch {
        // Non-fatal: appointments just won't be pre-populated this session.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Soonest upcoming appointment (today or later), used for the Home screen banner
  const todayIso = new Date().toISOString().split('T')[0];
  const nextAppointment = appointments
    .filter((appointment) => appointment.isoDate >= todayIso)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))[0];

  const handleSaveAppointment = async (input: NewAppointmentInput) => {
    let id = `appt-${Date.now()}`;

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const saved = await saveStoredAppointment(
          {
            doctor_name: input.doctorName,
            specialty: input.specialty,
            iso_date: input.isoDate,
            time: input.time,
            location: input.location,
            notes: input.notes,
          },
          userData.user.id
        );
        id = saved.id;
      }
    }

    const newAppointment: DoctorAppointment = {
      id,
      doctorName: input.doctorName,
      specialty: input.specialty,
      isoDate: input.isoDate,
      date: formatDisplayDate(input.isoDate),
      time: input.time,
      location: input.location,
      notes: input.notes,
    };

    setAppointments((prev) =>
      [...prev, newAppointment].sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    );

    // Also surface the appointment as a timeline event so it shows up in the
    // Timeline tab and in Home's "Recent Health Events" list.
    const appointmentEvent: TimelineEvent = {
      id: `evt-${id}`,
      date: newAppointment.date,
      isoDate: input.isoDate,
      monthGroup: formatMonthGroup(input.isoDate),
      type: 'visit',
      title: `Appointment with ${input.doctorName}`,
      subtitle: input.specialty || 'Doctor appointment',
      badgeText: 'Upcoming',
      summary:
        input.notes ||
        `Upcoming appointment with ${input.doctorName}${input.location ? ` at ${input.location}` : ''}.`,
      extractedInfo: [],
      sourceDocumentId: id,
      sourceDocumentTitle: `Appointment · ${input.doctorName}`,
      sourceDocumentType: 'Appointment',
      sourceDate: newAppointment.date,
      confirmed: true,
    };
    setTimelineEvents((prev) => [appointmentEvent, ...prev]);
  };

  const handleNavigateTab = (tab: TabType) => {
    setIsDoctorPrepOpen(false);
    setActiveTab(tab);
  };

  const handleSelectAiQuestion = (
    question: string,
    actionType: 'what_changed' | 'previous_episodes' | 'doctor_prep' | 'summary' | 'custom' = 'custom'
  ) => {
    if (actionType === 'doctor_prep') {
      setIsDoctorPrepOpen(true);
      return;
    }
    setAiQuestionPrompt(question);
    setAiActionType(actionType);
    setActiveTab('ask_ai');
    setIsDoctorPrepOpen(false);
  };

  const handleViewSource = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setSelectedDocument(doc);
    }
  };

  const handleAddConfirmedEvents = (
    newEvents: TimelineEvent[],
    newDocument: HealthDocument
  ) => {
    setTimelineEvents((prev) => [...newEvents, ...prev]);
    setDocuments((prev) => [newDocument, ...prev]);
  };

  const handleResetData = () => {
    setTimelineEvents([]);
    setDocuments([]);
    setAppointments([]);
  };

  return (
    <MobileFrame
      bottomNav={
        <BottomNavigation
          activeTab={activeTab}
          onChangeTab={handleNavigateTab}
          recordsCount={documents.length}
        />
      }
    >
      {/* If Doctor Prep screen is open, display it as top-level screen */}
      {isDoctorPrepOpen ? (
        <DoctorPrepScreen
          briefing={doctorBriefing}
          onBack={() => setIsDoctorPrepOpen(false)}
          onOpenShareSheet={() => setIsShareSheetOpen(true)}
          onViewSource={handleViewSource}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeScreen
              timelineEvents={timelineEvents}
              nextAppointment={nextAppointment}
              onOpenDoctorPrep={() => setIsDoctorPrepOpen(true)}
              onNavigateTab={handleNavigateTab}
              onSelectAiQuestion={handleSelectAiQuestion}
              onSelectEvent={(event) => setSelectedEvent(event)}
              onAddAppointment={() => setIsAddAppointmentOpen(true)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineScreen
              timelineEvents={timelineEvents}
              onSelectEvent={(event) => setSelectedEvent(event)}
              onOpenAddRecord={() => setIsUploadFlowOpen(true)}
            />
          )}

          {activeTab === 'ask_ai' && (
            <AskAIScreen
              timelineEvents={timelineEvents}
              documents={documents}
              medications={[]}
              labResults={[]}
              onOpenDoctorPrep={() => setIsDoctorPrepOpen(true)}
              onViewSource={handleViewSource}
              initialQuestion={aiQuestionPrompt}
              initialActionType={aiActionType}
            />
          )}

          {activeTab === 'records' && (
            <RecordsScreen
              documents={documents}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onOpenAddRecord={() => setIsUploadFlowOpen(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              patient={patient}
              timelineEvents={timelineEvents}
              documents={documents}
              onResetData={handleResetData}
            />
          )}
        </>
      )}

      {/* Modals and Sheets */}
      <DocumentViewerModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />

      <TimelineEventSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onViewSource={handleViewSource}
      />

      <ShareSheetModal
        isOpen={isShareSheetOpen}
        briefing={doctorBriefing}
        onClose={() => setIsShareSheetOpen(false)}
      />

      <UploadFlowModal
        isOpen={isUploadFlowOpen}
        onClose={() => setIsUploadFlowOpen(false)}
        onConfirmEvents={handleAddConfirmedEvents}
      />

      <AddAppointmentModal
        isOpen={isAddAppointmentOpen}
        onClose={() => setIsAddAppointmentOpen(false)}
        onSave={handleSaveAppointment}
      />
    </MobileFrame>
  );
}
export default App;