import { Client, Appointment } from './types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    avatar: 'https://picsum.photos/200/200?random=1',
    status: 'Active',
    diagnosis: 'Generalized Anxiety Disorder',
    nextAppointment: new Date(Date.now() + 86400000).toISOString(),
    documents: [
      { id: 'd1', name: 'Intake_Form.pdf', type: 'application/pdf', uploadDate: '2023-10-01' },
      { id: 'd2', name: 'Anxiety_Worksheet_v2.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadDate: '2023-11-15' }
    ],
    notes: [
      {
        id: 'n1',
        date: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        content: "Patient reported increased stress at work due to restructuring. Sleep has been disrupted, waking up at 3 AM unable to fall back asleep. We discussed grounding techniques and she agreed to try the '5-4-3-2-1' method daily. Expressed concern about upcoming family gathering.",
        sentiment: 'Concern',
        summary: "Work stress causing insomnia. Introduced grounding techniques. Anxiety regarding family events."
      },
      {
        id: 'n2',
        date: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
        content: "Initial session. Established rapport. Patient describes a history of 'worrying about everything'. No current medication. Goals: Reduce daily anxiety levels, improve sleep quality.",
        sentiment: 'Neutral'
      }
    ]
  },
  {
    id: 'c2',
    name: 'Michael Chen',
    avatar: 'https://picsum.photos/200/200?random=2',
    status: 'Active',
    diagnosis: 'Mild Depression',
    nextAppointment: new Date(Date.now() + 172800000).toISOString(),
    documents: [],
    notes: [
      {
        id: 'n3',
        date: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        content: "Michael is feeling slightly better. Started gym 2x a week. Still struggling with motivation for work tasks. Discussed behavioral activation strategies.",
        sentiment: 'Positive'
      }
    ]
  },
  {
    id: 'c3',
    name: 'Elena Rodriguez',
    avatar: 'https://picsum.photos/200/200?random=3',
    status: 'Archived',
    diagnosis: 'Adjustment Disorder',
    documents: [],
    notes: []
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', clientId: 'c1', date: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 50, type: 'In-Person' },
  { id: 'a2', clientId: 'c2', date: new Date(Date.now() + 172800000).toISOString(), durationMinutes: 50, type: 'Virtual' },
];
