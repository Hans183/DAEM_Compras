import { ProfileForm } from "./components/profile-form";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground">
                    Administra tu información personal y configuración de cuenta
                </p>
            </div>

            <ProfileForm />
        </div>
    );
}
