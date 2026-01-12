import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Hr,
    Link,
} from "@react-email/components";
import * as React from "react";

interface PurchaseAssignedProps {
    buyerName: string;
    numeroOrdinario: number;
    unidadRequirente: string;
    description: string;
    actionUrl: string;
}

export const PurchaseAssignedTemplate = ({
    buyerName = "Comprador",
    numeroOrdinario = 0,
    unidadRequirente = "Unidad Desconocida",
    description = "Sin descripción",
    actionUrl = "https://compras.daemlu.cl/dashboard",
}: PurchaseAssignedProps) => {
    return (
        <Html>
            <Head />
            <Preview>Nueva compra asignada: Ord. {String(numeroOrdinario)}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src="https://admin.daemlu.cl/uploads/logo_email_f190a49f49.png"
                            width="auto"
                            height="96"
                            alt="DAEM La Unión"
                            style={{ margin: "0 auto" }}
                        />
                    </Section>

                    <Section style={content}>
                        <Heading style={title}>Nueva Solicitud Asignada</Heading>
                        <Text style={paragraph}>Hola <strong>{buyerName}</strong>,</Text>
                        <Text style={paragraph}>
                            Se te ha asignado una nueva solicitud de compra para gestión. Por favor revisa los detalles a continuación.
                        </Text>

                        <Section style={infoBox}>
                            <div style={infoRow}>
                                <Text style={label}>Nº Ordinario</Text>
                                <Text style={value}>{numeroOrdinario}</Text>
                            </div>
                            <Hr style={divider} />
                            <div style={infoRow}>
                                <Text style={label}>Unidad Requirente</Text>
                                <Text style={value}>{unidadRequirente}</Text>
                            </div>
                            <Hr style={divider} />
                            <div style={infoRow}>
                                <Text style={label}>Descripción</Text>
                                <Text style={value}>{description}</Text>
                            </div>
                        </Section>

                        <Section style={btnContainer}>
                            <Button style={button} href={actionUrl}>
                                Gestionar Compra
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            Si tienes dudas, contacta al administrador del sistema.
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} DAEM La Unión. Todos los derechos reservados.
                        </Text>
                        <Link href="https://compras.daemlu.cl" style={footerLink}>
                            Ir a la plataforma
                        </Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default PurchaseAssignedTemplate;

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    padding: "20px 0",
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    maxWidth: "600px",
    border: "1px solid #e1e1e1",
    overflow: "hidden",
};

const header = {
    backgroundColor: "#111827", // Dark elegant header restored
    padding: "24px",
    textAlign: "center" as const,
};

const headerTitle = {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "bold",
    margin: "0",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
};

const content = {
    padding: "40px",
};

const title = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1a1a1a",
    margin: "0 0 20px",
    textAlign: "center" as const,
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#525f7f",
    margin: "0 0 20px",
};

const infoBox = {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "24px",
    margin: "24px 0",
    border: "1px solid #e2e8f0",
};

const infoRow = {
    margin: "8px 0",
};

const label = {
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    color: "#94a3b8",
    margin: "0 0 4px",
    letterSpacing: "0.5px",
};

const value = {
    fontSize: "16px",
    fontWeight: "500",
    color: "#0f172a",
    margin: "0",
};

const divider = {
    borderColor: "#e2e8f0",
    margin: "16px 0",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#2563eb", // Blue primary
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

const footer = {
    backgroundColor: "#f6f9fc",
    padding: "24px",
    textAlign: "center" as const,
    borderTop: "1px solid #e1e1e1",
};

const footerText = {
    fontSize: "12px",
    color: "#8898aa",
    margin: "0 0 8px",
};

const footerLink = {
    fontSize: "12px",
    color: "#2563eb",
    textDecoration: "underline",
};
