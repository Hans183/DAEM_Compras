"use server";

import { render } from "@react-email/render";
import { AlertTemplate } from "@/emails/alert-template";
import { sendMail } from "@/lib/mail";

export async function sendTestEmail(to: string) {
    try {
        const emailHtml = await render(
            AlertTemplate({
                title: "Test Email from Compras DAEM",
                message: "This is a test email to verify the notification system configuration.",
                actionText: "Go to Dashboard",
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
            })
        );

        const result = await sendMail({
            to,
            subject: "Test Notification - Compras DAEM",
            html: emailHtml,
        });

        return result;
    } catch (error) {
        console.error("Failed to send test email:", error);
        return { success: false, error };
    }
}

export async function notifyBuyer({
    email,
    buyerName,
    numeroOrdinario,
    unidadRequirente,
    description,
}: {
    email: string;
    buyerName: string;
    numeroOrdinario: number;
    unidadRequirente: string;
    description: string;
}) {
    try {
        // Import dynamically to avoid circular dependencies if any, though not expected here
        const { render } = await import("@react-email/render");
        const { PurchaseAssignedTemplate } = await import("@/emails/purchase-assigned");

        const emailHtml = await render(
            PurchaseAssignedTemplate({
                buyerName,
                numeroOrdinario: Number(numeroOrdinario), // Ensure number
                unidadRequirente,
                description,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/compras`,
            })
        );

        console.log("Generated Email HTML Length:", emailHtml.length); // DEBUG
        if (emailHtml.length === 0) console.error("CRITICAL: Generated HTML is empty!");

        const result = await sendMail({
            to: email,
            subject: `Nueva Compra Asignada (Ord. ${numeroOrdinario})`,
            html: emailHtml,
        });

        return result;
    } catch (error) {
        console.error("Failed to send notification email:", error);
        return { success: false, error };
    }
}
