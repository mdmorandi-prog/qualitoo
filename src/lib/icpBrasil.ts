/**
 * Leitura e validação de certificados digitais ICP-Brasil (padrão X.509 / MP 2.200-2).
 *
 * Aceita certificados públicos nos formatos PEM (.pem/.crt/.cer base64) e DER (.cer/.der).
 * Extrai titular, emissor, número de série, validade e o CPF/CNPJ presente na extensão
 * "otherName" da ICP-Brasil (OIDs 2.16.76.1.3.1 — pessoa física; 2.16.76.1.3.3 — pessoa jurídica).
 */
import forge from "node-forge";

export interface IcpCertificateInfo {
  subject: string;
  issuer: string;
  serial: string;
  cpfCnpj: string | null;
  validFrom: string; // AAAA-MM-DD
  validTo: string; // AAAA-MM-DD
  policy: string;
  isIcpBrasil: boolean;
  isExpired: boolean;
  fingerprint: string;
}

const attr = (fields: any[], name: string): string =>
  fields.find((f) => f.shortName === name || f.name === name)?.value ?? "";

const describe = (fields: any[]): string => {
  const cn = attr(fields, "CN");
  const ou = attr(fields, "OU");
  const o = attr(fields, "O");
  return [cn, ou, o].filter(Boolean).join(" — ");
};

/** Procura sequências de dígitos compatíveis com CPF (11) ou CNPJ (14) na extensão subjectAltName. */
const extractCpfCnpj = (cert: forge.pki.Certificate): string | null => {
  const raw = JSON.stringify(
    (cert.extensions ?? []).map((e: any) => e.value ?? e.altNames ?? ""),
  );
  const digits = raw.replace(/[^0-9]/g, "");
  // Padrão ICP-Brasil pessoa física: DDDDDDDDDDDDDDDD (data nasc + CPF + ...)
  const cpf = digits.match(/\d{8}(\d{11})/);
  if (cpf) return cpf[1];
  const cnpj = digits.match(/(\d{14})/);
  return cnpj ? cnpj[1] : null;
};

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

export function parseCertificate(buffer: ArrayBuffer): IcpCertificateInfo {
  const bytes = new Uint8Array(buffer);
  const binary = forge.util.createBuffer(
    Array.from(bytes).map((b) => String.fromCharCode(b)).join(""),
  );

  let cert: forge.pki.Certificate;
  const asText = new TextDecoder().decode(bytes);
  if (asText.includes("-----BEGIN CERTIFICATE-----")) {
    cert = forge.pki.certificateFromPem(asText);
  } else {
    const asn1 = forge.asn1.fromDer(binary);
    cert = forge.pki.certificateFromAsn1(asn1);
  }

  const issuer = describe(cert.issuer.attributes as any[]);
  const now = new Date();
  const policy =
    (cert.extensions ?? []).some((e: any) => String(e.id ?? "").startsWith("2.16.76.1.2"))
      ? "ICP-Brasil (política reconhecida)"
      : "X.509 padrão";

  return {
    subject: describe(cert.subject.attributes as any[]),
    issuer,
    serial: cert.serialNumber?.toUpperCase() ?? "",
    cpfCnpj: extractCpfCnpj(cert),
    validFrom: toIsoDate(cert.validity.notBefore),
    validTo: toIsoDate(cert.validity.notAfter),
    policy,
    isIcpBrasil: /ICP-?Brasil|AC\s|Autoridade Certificadora/i.test(issuer),
    isExpired: now < cert.validity.notBefore || now > cert.validity.notAfter,
    fingerprint: forge.md.sha256
      .create()
      .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
      .digest()
      .toHex()
      .toUpperCase(),
  };
}

export const formatCpfCnpj = (value: string | null): string => {
  if (!value) return "—";
  if (value.length === 11) return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (value.length === 14) return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
};
