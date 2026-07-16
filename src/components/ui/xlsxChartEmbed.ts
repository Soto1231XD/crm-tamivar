import JSZip from "jszip";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function sheetXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetData/><drawing r:id="rId1"/></worksheet>`
  );
}

function sheetRelsXml(drawingFile: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1"` +
    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"` +
    ` Target="${drawingFile}"/></Relationships>`
  );
}

function drawingXml(count: number): string {
  const COL_W = 13; // columnas Excel por gráfica
  const ROWS  = 30;
  const anchors = Array.from({ length: count }, (_, i) => {
    const c0 = i * (COL_W + 1);
    const c1 = c0 + COL_W;
    return (
      `<xdr:twoCellAnchor moveWithCells="1" sizeWithCells="1">` +
      `<xdr:from><xdr:col>${c0}</xdr:col><xdr:colOff>114300</xdr:colOff>` +
      `<xdr:row>1</xdr:row><xdr:rowOff>114300</xdr:rowOff></xdr:from>` +
      `<xdr:to><xdr:col>${c1}</xdr:col><xdr:colOff>0</xdr:colOff>` +
      `<xdr:row>${ROWS}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>` +
      `<xdr:pic><xdr:nvPicPr>` +
      `<xdr:cNvPr id="${i + 2}" name="ChartImg${i + 1}"/>` +
      `<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>` +
      `</xdr:nvPicPr>` +
      `<xdr:blipFill><a:blip r:embed="rId${i + 1}"/>` +
      `<a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
      `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>` +
      `</xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`
    );
  }).join("");

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<xdr:wsDr` +
    ` xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"` +
    ` xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `${anchors}</xdr:wsDr>`
  );
}

function drawingRelsXml(count: number): string {
  const rels = Array.from(
    { length: count },
    (_, i) =>
      `<Relationship Id="rId${i + 1}"` +
      ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"` +
      ` Target="../media/xlsxchart${i + 1}.png"/>`,
  ).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `${rels}</Relationships>`
  );
}

/**
 * Toma un buffer xlsx existente y añade una nueva hoja con imágenes PNG incrustadas.
 */
export async function embedChartsAsNewSheet(
  xlsxBuffer: ArrayBuffer | Uint8Array,
  sheetName: string,
  pngBase64List: string[],
): Promise<Blob> {
  const zip = await JSZip.loadAsync(xlsxBuffer);

  // ─── Averiguar IDs existentes en workbook ────────────────────────────
  const wbXml    = await zip.file("xl/workbook.xml")!.async("string");
  const wbRels   = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");

  const sheetIds = [...wbXml.matchAll(/sheetId="(\d+)"/g)].map(m => parseInt(m[1]));
  const rIds     = [...wbRels.matchAll(/Id="rId(\d+)"/g)].map(m => parseInt(m[1]));
  const nextSid  = Math.max(0, ...sheetIds) + 1;
  const nextRid  = Math.max(0, ...rIds) + 1;
  const wbSheetRid = `rId${nextRid}`;

  // ─── Nombres de archivos internos (únicos) ───────────────────────────
  const TAG       = `_xchart${nextSid}`;
  const sheetFile = `xl/worksheets/sheet${TAG}.xml`;
  const drawFile  = `xl/drawings/drawing${TAG}.xml`;

  // ─── Añadir imágenes ─────────────────────────────────────────────────
  pngBase64List.forEach((b64, i) => {
    zip.file(`xl/media/xlsxchart${i + 1}.png`, base64ToBytes(b64));
  });

  // ─── Añadir drawing + sus rels ───────────────────────────────────────
  zip.file(drawFile, drawingXml(pngBase64List.length));
  zip.file(`xl/drawings/_rels/drawing${TAG}.xml.rels`, drawingRelsXml(pngBase64List.length));

  // ─── Añadir sheet XML + sus rels ─────────────────────────────────────
  zip.file(sheetFile, sheetXml());
  zip.file(
    `xl/worksheets/_rels/sheet${TAG}.xml.rels`,
    sheetRelsXml(`../drawings/drawing${TAG}.xml`),
  );

  // ─── Actualizar workbook.xml ──────────────────────────────────────────
  const safe = sheetName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const updatedWb = wbXml.replace(
    "</sheets>",
    `<sheet name="${safe}" sheetId="${nextSid}" r:id="${wbSheetRid}"/></sheets>`,
  );
  zip.file("xl/workbook.xml", updatedWb);

  // ─── Actualizar workbook rels ─────────────────────────────────────────
  const relTarget = `worksheets/sheet${TAG}.xml`;
  const newWbRel  =
    `<Relationship Id="${wbSheetRid}"` +
    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"` +
    ` Target="${relTarget}"/>`;
  zip.file("xl/_rels/workbook.xml.rels", wbRels.replace("</Relationships>", `${newWbRel}</Relationships>`));

  // ─── Actualizar [Content_Types].xml ──────────────────────────────────
  const ct     = await zip.file("[Content_Types].xml")!.async("string");
  let updatedCt = ct;
  if (!updatedCt.includes('Extension="png"')) {
    updatedCt = updatedCt.replace("</Types>", `<Default Extension="png" ContentType="image/png"/></Types>`);
  }
  updatedCt = updatedCt.replace(
    "</Types>",
    `<Override PartName="/${sheetFile}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/${drawFile}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>` +
    `</Types>`,
  );
  zip.file("[Content_Types].xml", updatedCt);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
  });
}
