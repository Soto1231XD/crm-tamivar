import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import Logo from "@/assets/images/Logo.png";
import type { DevelopmentRecord } from "@/interfaces/development.interface";
import {
  calculateFinalPrice,
  formatCurrency,
  formatPublicDireccion,
  getMeaningfulCommercialSchemes,
  getPropertyStatusStyles,
  stripEmojis,
} from "../utils/formatters";

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingHorizontal: 35,
    paddingBottom: 90,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  logoContainer: { marginBottom: 20 },
  logo: { width: 200, height: 80 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 15,
    marginBottom: 20,
  },
  titleGroup: { width: "75%" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginRight: 6,
  },
  priceValue: {
    fontSize: 18,
    color: "#4f46e5",
    fontWeight: "bold",
  },
  priceOriginal: {
    fontSize: 12,
    color: "#788495",
    textDecoration: "line-through",
    marginLeft: 8,
    marginBottom: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#fffbeb",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: "#1e293b",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#fbbf24",
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#312C85",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  col12: { width: "100%", marginBottom: 14, paddingRight: 8 },
  col6: { width: "50%", marginBottom: 12, paddingRight: 8 },
  col4: { width: "33.33%", marginBottom: 12, paddingRight: 8 },
  col3: { width: "25%", marginBottom: 12, paddingRight: 8 },
  label: {
    fontSize: 9,
    color: "#334155",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: { fontSize: 11, color: "#0f172a" },
  valueBold: { fontSize: 11, color: "#0f172a", fontWeight: "bold" },
  textParagraph: { fontSize: 10, color: "#1e293b", lineHeight: 1.5 },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  galleryCol: {
    width: "48.5%",
    marginBottom: 12,
  },
  galleryImage: {
    height: 160,
    objectFit: "cover",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modelCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginVertical: 10,
  },
  schemeBlock: {
    marginTop: 6,
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    backgroundColor: "#ffffff",
    textAlign: "center",
    color: "#475569",
    fontSize: 9,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    paddingBottom: 4,
  },
});

function renderSchemeSummary(
  development: DevelopmentRecord["esquema_comercial"],
  color: string,
) {
  return development.map((scheme, idx) => {
    const { finalPrice, originalPrice, hasDiscount } = calculateFinalPrice(
      scheme.precio,
      scheme.descuento_cantidad,
    );

    return (
      <View key={`${scheme.tipo_operacion}-${idx}`} style={styles.priceRow}>
        <Text style={styles.priceLabel}>{scheme.tipo_operacion}:</Text>
        <Text style={[styles.priceValue, { color }]}>
          {formatCurrency(finalPrice)}
        </Text>
        {hasDiscount ? (
          <Text style={styles.priceOriginal}>{formatCurrency(originalPrice)}</Text>
        ) : null}
      </View>
    );
  });
}

function formatBooleanFeatures(features?: Record<string, unknown> | null) {
  if (!features) return "Sin características registradas.";

  const enabled = Object.entries(features)
    .filter(([, value]) => typeof value === "boolean" && value)
    .map(([key]) => key.replace(/_/g, " "));

  return enabled.length > 0
    ? enabled.join(", ")
    : "Sin características registradas.";
}

export const DevelopmentPdfDocument = ({
  development,
}: {
  development: DevelopmentRecord;
}) => {
  const statusStyle = getPropertyStatusStyles(development.estatus);
  const developmentSchemes = getMeaningfulCommercialSchemes(development);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Image src={Logo} style={styles.logo} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{development.titulo}</Text>
            {developmentSchemes.length > 0
              ? renderSchemeSummary(developmentSchemes, "#4f46e5")
              : null}
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {development.estatus}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Generales del Desarrollo</Text>
          <View style={styles.grid}>
            <View style={styles.col12}>
              <Text style={styles.label}>Ubicación</Text>
              <Text style={styles.valueBold}>
                {formatPublicDireccion(development.direccion)}
              </Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Tipo</Text>
              <Text style={styles.value}>{development.tipo_inmueble}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Entrega</Text>
              <Text style={styles.value}>
                {development.entrega_inmediata
                  ? "Entrega inmediata"
                  : development.fecha_entrega
                    ? new Date(development.fecha_entrega).toLocaleDateString("es-MX")
                    : "Por definir"}
              </Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Tipos de pago</Text>
              <Text style={styles.value}>
                {development.tipos_pago?.length
                  ? development.tipos_pago.join(", ")
                  : "No especificados"}
              </Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Medidas generales</Text>
              <Text style={styles.value}>
                Terreno: {development.medidas?.terreno_m2 ?? 0} m², Construcción:{" "}
                {development.medidas?.construccion_m2 ?? 0} m²
              </Text>
            </View>
            <View style={styles.col6}>
              <Text style={styles.label}>Amenidades principales</Text>
              <Text style={styles.value}>
                {stripEmojis(development.amenidades || "") || "Sin amenidades registradas."}
              </Text>
            </View>
            {development.descripcion ? (
              <View style={styles.col12}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.textParagraph}>
                  {stripEmojis(development.descripcion)}
                </Text>
              </View>
            ) : null}
            {development.servicios_instalaciones ? (
              <View style={styles.col12}>
                <Text style={styles.label}>Servicios e instalaciones</Text>
                <Text style={styles.textParagraph}>
                  {stripEmojis(development.servicios_instalaciones)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {development.imagenes?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galería del Desarrollo</Text>
            <View style={styles.galleryGrid}>
              {development.imagenes.map((img, idx) => (
                <View key={`development-img-${idx}`} style={styles.galleryCol} wrap={false}>
                  <Image src={img.url} style={styles.galleryImage} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modelos del Desarrollo</Text>
          {development.modelos?.length ? (
            development.modelos.map((model, index) => (
              <View key={`model-${model.id ?? index}`} style={styles.modelCard}>
                <Text style={styles.subSectionTitle}>
                  Modelo {index + 1}: {model.nombre}
                </Text>

                {model.descripcion ? (
                  <View style={styles.col12}>
                    <Text style={styles.label}>Descripción</Text>
                    <Text style={styles.textParagraph}>
                      {stripEmojis(model.descripcion)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.grid}>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Operaciones</Text>
                    <Text style={styles.value}>
                      {model.esquema_comercial
                        .map((scheme) => scheme.tipo_operacion)
                        .join(" / ")}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Tipos de pago</Text>
                    <Text style={styles.value}>
                      {model.tipos_pago?.length
                        ? model.tipos_pago.join(", ")
                        : "No especificados"}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Medidas</Text>
                    <Text style={styles.value}>
                      Terreno: {model.medidas?.terreno_m2 ?? 0} m², Construcción:{" "}
                      {model.medidas?.construccion_m2 ?? 0} m²
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Distribución</Text>
                    <Text style={styles.value}>
                      Recámaras: {model.caracteristicas?.recamaras ?? 0}, Baños:{" "}
                      {model.caracteristicas?.banos ?? 0}, Estacionamiento:{" "}
                      {model.caracteristicas?.estacionamiento ?? 0}
                    </Text>
                  </View>
                  <View style={styles.col12}>
                    <Text style={styles.label}>Características adicionales</Text>
                    <Text style={styles.value}>
                      {formatBooleanFeatures(
                        (model.caracteristicas as Record<string, unknown> | undefined) ??
                          undefined,
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.schemeBlock}>
                  {renderSchemeSummary(model.esquema_comercial, "#312C85")}
                </View>

                {model.comentarios ? (
                  <View style={styles.col12}>
                    <Text style={styles.label}>Comentarios del modelo</Text>
                    <Text style={styles.textParagraph}>
                      {stripEmojis(model.comentarios)}
                    </Text>
                  </View>
                ) : null}

                {model.imagenes?.length ? (
                  <View style={styles.galleryGrid}>
                    {model.imagenes.map((img, imgIndex) => (
                      <View
                        key={`model-img-${index}-${imgIndex}`}
                        style={styles.galleryCol}
                      >
                        <Image src={img.url} style={styles.galleryImage} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.value}>Sin modelos registrados.</Text>
          )}
        </View>

        <Text style={styles.footer} fixed>
          Generado por CRM Tamivar • Ficha Técnica de Desarrollo: {development.titulo}
        </Text>
      </Page>
    </Document>
  );
};
