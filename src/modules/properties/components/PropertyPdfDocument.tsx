import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { PropertyRecord } from "@/interfaces/property.interface";
import {
  formatCurrency,
  formatPublicDireccion,
  calculateFinalPrice,
  getPropertyStatusStyles,
} from "../utils/formatters";
import Logo from "@/assets/images/Logo.png";
import { stripEmojis } from "../utils/formatters";

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingHorizontal: 35,
    paddingBottom: 60,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },

  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 80,
  },

  // Header
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

  mainImage: {
    height: 220,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 20,
  },

  // Secciones Generales
  section: { marginBottom: 20 },
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

  // Estilos para la tabla financiera
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thCol: {
    width: "25%",
    fontSize: 9,
    fontWeight: "bold",
    color: "#334155",
    textTransform: "uppercase",
  },
  tdCol: { width: "25%", fontSize: 10, color: "#0f172a" },
  tdColBold: {
    width: "25%",
    fontSize: 10,
    color: "#4f46e5",
    fontWeight: "bold",
  },

  // Sistema de Grid (usando porcentajes)
  grid: { flexDirection: "row", flexWrap: "wrap" },
  col12: { width: "100%", marginBottom: 18, paddingRight: 10 },
  col6: { width: "50%", marginBottom: 15, paddingRight: 10 },
  col4: { width: "33.33%", marginBottom: 15, paddingRight: 5 },
  col3: { width: "25%", marginBottom: 15, paddingRight: 5 },

  // Textos
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

  // Características Booleanas
  booleanGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  booleanItem: {
    width: "33.33%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  booleanText: { fontSize: 10, color: "#1e293b", textTransform: "capitalize" },

  // Imagenes
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  galleryCol: {
    width: "48.5%",
    marginBottom: 15,
  },
  galleryImage: {
    height: 170,
    objectFit: "cover",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  // Sección Ubicación - mapa de zona
  mapsImage: {
    width: "100%",
    height: 190,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mapsCaption: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 5,
    fontStyle: "italic",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: "center",
    color: "#475569",
    fontSize: 9,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

export const PropertyPdfDocument = ({
  property,
  mapsImageBase64,
}: {
  property: PropertyRecord;
  mapsImageBase64?: string;
}) => {
  // Obtener estilos dinámicos del estatus
  const statusStyle = getPropertyStatusStyles(property.estatus);
  const showLegalStatus = Array.isArray(property.esquema_comercial)
    ? property.esquema_comercial.some((esquema) =>
        ["Venta", "Preventa"].includes(esquema.tipo_operacion),
      )
    : false;
  const showPetFriendly = Array.isArray(property.esquema_comercial)
    ? property.esquema_comercial.some(
        (esquema) => esquema.tipo_operacion === "Renta",
      )
    : false;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Image src={Logo} style={styles.logo} />
        </View>

        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{property.titulo}</Text>

            {property.esquema_comercial.map((esquema, idx) => {
              const { finalPrice, originalPrice, hasDiscount } =
                calculateFinalPrice(esquema.precio, esquema.descuento_cantidad);

              return (
                <View key={idx} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {esquema.tipo_operacion}:
                  </Text>

                  <Text style={styles.priceValue}>
                    {formatCurrency(finalPrice)}
                  </Text>

                  {hasDiscount && (
                    <Text style={styles.priceOriginal}>
                      {formatCurrency(originalPrice)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          {/* Etiqueta con colores dinámicos */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {property.estatus}
            </Text>
          </View>
        </View>

        {/* DATOS GENERALES */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Datos Generales</Text>
          <View style={styles.grid}>
            {/* Fila Completa */}
            <View style={styles.col12}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.valueBold}>
                {formatPublicDireccion(property.direccion)}
              </Text>
            </View>

            {/* Fila Única: Operación, Tipo, Estado Legal y Pet Friendly */}
            {(() => {
              const extraCols = (showLegalStatus ? 1 : 0) + (showPetFriendly ? 1 : 0);
              const colStyle = extraCols === 0 ? styles.col6 : extraCols === 1 ? styles.col4 : styles.col3;
              return (
                <>
                  <View style={colStyle}>
                    <Text style={styles.label}>Operación</Text>
                    <Text style={[styles.value, { textTransform: "capitalize" }]}>
                      {property.esquema_comercial
                        .map((e) => e.tipo_operacion.toLowerCase())
                        .join(" / ")}
                    </Text>
                  </View>
                  <View style={colStyle}>
                    <Text style={styles.label}>Tipo de Inmueble</Text>
                    <Text style={[styles.value, { textTransform: "capitalize" }]}>
                      {property.tipo_inmueble}
                    </Text>
                  </View>
                </>
              );
            })()}
            {showLegalStatus ? (
              <View style={showPetFriendly ? styles.col3 : styles.col4}>
                <Text style={styles.label}>Estado Legal</Text>
                <Text
                  style={[
                    styles.valueBold,
                    { color: property.tiene_gravamen ? "#ef4444" : "#10b981" },
                  ]}
                >
                  {property.tiene_gravamen
                    ? "Con Gravamen"
                    : "Libre de Gravamen"}
                </Text>
              </View>
            ) : null}

            {showPetFriendly ? (
              <View style={showLegalStatus ? styles.col3 : styles.col4}>
                <Text style={styles.label}>Mascotas</Text>
                <Text
                  style={[
                    styles.valueBold,
                    { color: property.pet_friendly ? "#10b981" : "#ef4444" },
                  ]}
                >
                  {property.pet_friendly ? "Pet Friendly" : "No acepta mascotas"}
                </Text>
              </View>
            ) : null}

            <View style={styles.col12}>
              <Text style={styles.label}>Tipos de Pago Aceptados</Text>
              <Text style={styles.value}>{property.tipos_pago.join(", ")}</Text>
            </View>
          </View>
        </View>

        {/* DETALLES FINANCIEROS */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Desglose Financiero</Text>

          {/* Cabecera de la Tabla */}
          <View style={styles.tableHeader}>
            <Text style={styles.thCol}>Esquema</Text>
            <Text style={styles.thCol}>Precio Base</Text>
            <Text style={styles.thCol}>Descuento</Text>
            <Text style={styles.thCol}>Precio Final</Text>
          </View>

          {property.esquema_comercial.map((esquema, idx) => {
            const {
              hasDiscount,
              originalPrice,
              discountAmount,
              finalPrice,
              discountPercentage,
            } = calculateFinalPrice(esquema.precio, esquema.descuento_cantidad);

            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tdCol, { fontWeight: "bold" }]}>
                  {esquema.tipo_operacion}
                </Text>
                <Text style={styles.tdCol}>
                  {formatCurrency(originalPrice)}
                </Text>
                <Text
                  style={[
                    styles.tdCol,
                    { color: hasDiscount ? "#10b981" : "#64748b" },
                  ]}
                >
                  {hasDiscount
                    ? `-${discountPercentage}% (${formatCurrency(discountAmount)})`
                    : "-"}
                </Text>
                <Text style={styles.tdColBold}>
                  {formatCurrency(finalPrice)}
                </Text>
              </View>
            );
          })}

          {/* Fila extra para Cuota de Mantenimiento si existe */}
          {property.cuota_mantenimiento && (
            <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
              <Text
                style={[
                  styles.tdCol,
                  { width: "75%", fontStyle: "italic", color: "#64748b" },
                ]}
              >
                * Cuota de mantenimiento mensual (No incluida en precio)
              </Text>
              <Text style={[styles.tdColBold, { color: "#334155" }]}>
                {formatCurrency(property.cuota_mantenimiento)}
              </Text>
            </View>
          )}
        </View>

        {/* DISTRIBUCIÓN Y DIMENSIONES */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Distribución y Dimensiones</Text>
          <View style={styles.grid}>
            {/* Dimensiones */}
            <View style={styles.col4}>
              <Text style={styles.label}>Terreno</Text>
              <Text style={styles.value}>{property.medidas.terreno_m2} m²</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Construcción</Text>
              <Text style={styles.value}>
                {property.medidas.construccion_m2} m²
              </Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Frente / Fondo</Text>
              <Text style={styles.value}>
                {property.medidas.frente}m / {property.medidas.fondo}m
              </Text>
            </View>

            {/* Distribución */}
            <View style={styles.col3}>
              <Text style={styles.label}>Recámaras</Text>
              <Text style={styles.valueBold}>
                {property.caracteristicas?.recamaras}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Baños</Text>
              <Text style={styles.valueBold}>
                {property.caracteristicas?.banos}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Estacionamiento</Text>
              <Text style={styles.valueBold}>
                {property.caracteristicas?.estacionamiento}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Niveles</Text>
              <Text style={styles.valueBold}>{property.pisos_tiene || 1}</Text>
            </View>
          </View>

          {/* Cuadrícula de Características Booleanas */}
          {property.caracteristicas && (
            <View style={styles.col12}>
              <Text style={styles.label}>Cuenta con</Text>
              <Text
                style={[
                  styles.value,
                  { textTransform: "capitalize", lineHeight: 1.5 },
                ]}
              >
                {Object.entries(property.caracteristicas)
                  // Filtramos solo las que son true
                  .filter(([_, value]) => typeof value === "boolean" && value)
                  // Limpiamos los guiones bajos
                  .map(([key]) => key.replace(/_/g, " "))
                  // Las unimos con coma y espacio
                  .join(", ")}
              </Text>
            </View>
          )}
        </View>

        {/* Descripción */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Descripción General</Text>
          <Text style={styles.textParagraph}>
            {stripEmojis(property.descripcion || "") ||
              "Sin descripción proporcionada."}
          </Text>
        </View>

        {/* Amenidades de la Zona */}
        {property.amenidades && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              Amenidades de la Zona/Complejo
            </Text>
            <Text style={styles.textParagraph}>
              {stripEmojis(property.amenidades)}
            </Text>
          </View>
        )}

        {/* Servicios e Instalaciones */}
        {property.servicios_instalaciones && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Servicios e Instalaciones</Text>
            <Text style={styles.textParagraph}>
              {stripEmojis(property.servicios_instalaciones)}
            </Text>
          </View>
        )}


        {/* Ubicación - Vista de la zona */}
        {mapsImageBase64 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Ubicación - Vista de la Zona</Text>
            <Image src={mapsImageBase64} style={styles.mapsImage} />
          </View>
        )}

        {/* Galería de imágenes */}
        {property.imagenes && property.imagenes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anexo Fotográfico</Text>

            <View style={styles.galleryGrid}>
              {property.imagenes.map((img, idx) => (
                <View key={idx} style={styles.galleryCol} wrap={false}>
                  <Image src={img.url} style={styles.galleryImage} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <Text style={styles.footer} fixed>
          Generado por CRM Tamivar • Ficha Técnica de Propiedad:{" "}
          {property.titulo}
        </Text>
      </Page>
    </Document>
  );
};
