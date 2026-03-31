import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import Logo from '@/assets/images/Logo.png';
import type { LeadRecord } from '@/interfaces/lead.interface';
import {
  formatAsesorExterno,
  formatCreatorName,
  formatDate,
  formatDateTime,
  formatPhone,
  getPriorityStyles,
  getStatusStyles,
} from '../utils/leads.utils';

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingHorizontal: 35,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 15,
    marginBottom: 20,
  },
  titleGroup: {
    width: '75%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: '#475569',
  },
  headerMetaGroup: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  inlineLabel: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#fffbeb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: '#1e293b',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col12: {
    width: '100%',
    marginBottom: 16,
    paddingRight: 10,
  },
  col6: {
    width: '50%',
    marginBottom: 15,
    paddingRight: 10,
  },
  label: {
    fontSize: 9,
    color: '#334155',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: '#0f172a',
  },
  valueBold: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: '#475569',
    fontSize: 9,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
});

type LeadPdfDocumentProps = {
  lead: LeadRecord;
  propertyTitle: string;
};

export function LeadPdfDocument({ lead, propertyTitle }: LeadPdfDocumentProps) {
  const statusStyle = getStatusStyles(lead.estado ?? '');
  const priorityStyle = getPriorityStyles(lead.prioridad ?? '');
  const fullName = `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Image src={Logo} style={styles.logo} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{fullName}</Text>
            <Text style={styles.subtitle}>Ficha individual de registro comercial</Text>
          </View>

          <View>
            <View style={styles.headerMetaGroup}>
              <Text style={styles.inlineLabel}>Estado:</Text>
              <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
                <Text style={[styles.badgeText, { color: statusStyle.color }]}>
                  {lead.estado?.trim() || 'Sin estado'}
                </Text>
              </View>
            </View>
            <View style={styles.headerMetaGroup}>
              <Text style={styles.inlineLabel}>Prioridad:</Text>
              <View style={[styles.badge, { backgroundColor: priorityStyle.backgroundColor }]}>
                <Text style={[styles.badgeText, { color: priorityStyle.color }]}>
                  {lead.prioridad?.trim() || 'Sin prioridad'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Datos del cliente</Text>
          <View style={styles.grid}>
            <View style={styles.col6}>
              <Text style={styles.label}>Nombre completo</Text>
              <Text style={styles.valueBold}>{fullName}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{formatPhone(lead.lada, lead.telefono)}</Text>
            </View>
            <View style={styles.col12}>
              <Text style={styles.label}>Correo electrónico</Text>
              <Text style={styles.value}>{lead.correo_electronico?.trim() || 'Sin correo'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Seguimiento comercial</Text>
          <View style={styles.grid}>
            <View style={styles.col6}>
              <Text style={styles.label}>Propiedad de interés</Text>
              <Text style={styles.valueBold}>{propertyTitle}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Registrado por</Text>
              <Text style={styles.value}>{formatCreatorName(lead.creador)}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Fecha de registro</Text>
              <Text style={styles.value}>{formatDate(lead.creado_en)}</Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Fecha de cita</Text>
              <Text style={styles.value}>{formatDateTime(lead.fecha_cita)}</Text>
            </View>
            <View style={styles.col12}>
              <Text style={styles.label}>Asesor externo</Text>
              <Text style={styles.value}>
                {formatAsesorExterno(lead.asesor_externo, lead.asesor_externo_nombre)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Comentarios</Text>
          <Text style={styles.paragraph}>{lead.comentarios?.trim() || 'Sin comentarios registrados.'}</Text>
        </View>

        <Text style={styles.footer} fixed>
          Generado por CRM Tamivar • Ficha de registro: {fullName}
        </Text>
      </Page>
    </Document>
  );
}
