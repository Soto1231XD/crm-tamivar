import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AdvisorStats } from "../types/statistics.types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 36,
    paddingBottom: 48,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  eyebrow: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 1.5,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  chartCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  chartDescription: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.4,
  },
  chartArea: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "stretch",
  },
  yAxis: {
    width: 34,
    height: 180,
    justifyContent: "space-between",
    paddingRight: 6,
    paddingBottom: 24,
  },
  yAxisLabel: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
  plotWrapper: {
    flexGrow: 1,
    flexBasis: 0,
    height: 180,
    position: "relative",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: "#cbd5e1",
    borderBottomColor: "#cbd5e1",
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  gridLineTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  gridLineMiddle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 66,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  gridLineBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 126,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  chartGrid: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    height: "100%",
  },
  chartColumn: {
    flexGrow: 1,
    flexBasis: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  chartValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  chartBarTrack: {
    width: 34,
    height: 120,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  leadBar: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  visitBar: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.3,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
  },
  emptyText: {
    fontSize: 10,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
});

type AdvisorReportPdfDocumentProps = {
  advisor: AdvisorStats;
};

type StatusItem = {
  status: string;
  count: number;
};

function buildStatusItems(counts: Record<string, number>) {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, count }))
    .sort((left, right) => right.count - left.count);
}

function formatAxisLabel(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

function buildYAxisTicks(items: StatusItem[]) {
  const maxValue = Math.max(...items.map((item) => item.count), 0);
  const safeMax = Math.max(maxValue, 1);
  return [safeMax, Math.round(safeMax * 0.66), Math.round(safeMax * 0.33), 0];
}

function StatusChart({
  title,
  description,
  items,
  total,
  tone,
}: {
  title: string;
  description: string;
  items: StatusItem[];
  total: number;
  tone: "lead" | "visit";
}) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          No hay registros para mostrar en este bloque.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartDescription}>{description}</Text>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {buildYAxisTicks(items).map((tick, index) => (
            <Text key={`${title}-tick-${index}`} style={styles.yAxisLabel}>
              {formatAxisLabel(tick)}
            </Text>
          ))}
        </View>

        <View style={styles.plotWrapper}>
          <View style={styles.gridLineTop} />
          <View style={styles.gridLineMiddle} />
          <View style={styles.gridLineBottom} />

          <View style={styles.chartGrid}>
            {items.map((item) => {
              const height = total > 0 ? Math.max((item.count / total) * 120, 12) : 0;

              return (
                <View key={`${title}-${item.status}`} style={styles.chartColumn}>
                  <Text style={styles.chartValue}>{item.count}</Text>

                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        tone === "lead" ? styles.leadBar : styles.visitBar,
                        { height },
                      ]}
                    />
                  </View>

                  <Text style={styles.chartLabel}>{item.status}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function AdvisorReportPdfDocument({
  advisor,
}: AdvisorReportPdfDocumentProps) {
  const leadItems = buildStatusItems(advisor.leadStatuses);
  const visitItems = buildStatusItems(advisor.visitStatuses);
  const totalAssigned = advisor.leadCount + advisor.visitCount;
  const now = new Date().toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CRM Tamivar · Reporte comercial</Text>
          <Text style={styles.title}>{advisor.name}</Text>
          <Text style={styles.subtitle}>
            Resumen individual de carga y avance comercial generado el {now}.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total asignado</Text>
            <Text style={styles.summaryValue}>{totalAssigned}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Registro de leads</Text>
            <Text style={styles.summaryValue}>{advisor.leadCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Registros visitas</Text>
            <Text style={styles.summaryValue}>{advisor.visitCount}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Graficas de estados</Text>
          <StatusChart
            title="Registros leads"
            description="Distribucion visible de los estados en leads asignados."
            items={leadItems}
            total={advisor.leadCount}
            tone="lead"
          />
        </View>

        <View style={styles.section}>
          <StatusChart
            title="Registros visitas"
            description="Distribucion visible de los estados en visitas asignadas."
            items={visitItems}
            total={advisor.visitCount}
            tone="visit"
          />
        </View>

        <Text style={styles.footer} fixed>
          Reporte individual del asesor {advisor.name} · Generado por CRM Tamivar
        </Text>
      </Page>
    </Document>
  );
}
