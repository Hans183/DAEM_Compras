import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface AlertTemplateProps {
  title?: string;
  message?: string;
  actionUrl?: string;
  actionText?: string;
}

const _baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "";

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
        <Body className="mx-auto my-auto bg-[#f6f9fc] p-6 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded-lg border border-[#e6ebf1] bg-white p-[40px] shadow-sm">
            <Section className="mt-0 mb-8 text-center">
              <Img
                src="https://admin.daemlu.cl/uploads/logo_daem_email_656dda4c2c.png"
                width="96"
                height="96"
                alt="DAEM Logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-semibold text-[#1a1b25] text-[24px]">
              {title}
            </Heading>
            <Text className="text-[#444] text-[16px] leading-[24px]">Hola,</Text>
            <Text className="text-[#444] text-[16px] leading-[24px]">{message}</Text>
            {actionUrl && (
              <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                  className="rounded-md bg-[#6366f1] px-6 py-3 text-center font-medium text-[14px] text-white no-underline transition-colors hover:bg-[#4f46e5]"
                  href={actionUrl}
                >
                  {actionText}
                </Button>
              </Section>
            )}
            <Hr className="my-6 border-[#e6ebf1]" />
            <Text className="text-center text-[#888] text-[12px] leading-[20px]">
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
