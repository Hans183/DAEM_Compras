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
    Tailwind,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface AlertTemplateProps {
    title?: string;
    message?: string;
    actionUrl?: string;
    actionText?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "";

export const AlertTemplate = ({
    title = "Notificación del Sistema",
    message = "Tiene una nueva notificación en el sistema de Compras DAEM.",
    actionUrl = "https://compras.daemlu.cl/dashboard",
    actionText = "Ver en Dashboard",
}: AlertTemplateProps) => {
    return (
        <Html>
            <Head />
            <Preview>{title}</Preview>
            <Tailwind>
                <Body className="bg-[#f6f9fc] my-auto mx-auto font-sans p-6">
                    <Container className="bg-white border border-[#e6ebf1] rounded-lg shadow-sm my-[40px] mx-auto p-[40px] max-w-[465px]">
                        <Section className="mt-0 mb-8 text-center">
                            <Img
                                src="https://admin.daemlu.cl/uploads/logo_daem_email_656dda4c2c.png"
                                width="96"
                                height="96"
                                alt="DAEM Logo"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-[#1a1b25] text-[24px] font-semibold text-center p-0 my-[30px] mx-0">
                            {title}
                        </Heading>
                        <Text className="text-[#444] text-[16px] leading-[24px]">
                            Hola,
                        </Text>
                        <Text className="text-[#444] text-[16px] leading-[24px]">
                            {message}
                        </Text>
                        {actionUrl && (
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Button
                                    className="bg-[#6366f1] hover:bg-[#4f46e5] rounded-md text-white text-[14px] font-medium no-underline text-center px-6 py-3 transition-colors"
                                    href={actionUrl}
                                >
                                    {actionText}
                                </Button>
                            </Section>
                        )}
                        <Hr className="border-[#e6ebf1] my-6" />
                        <Text className="text-[#888] text-[12px] leading-[20px] text-center">
                            DAEM La Union.
                            <br />
                            Este es un mensaje automático, por favor no responder.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AlertTemplate;
