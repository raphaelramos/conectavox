"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Form from "@radix-ui/react-form";
import { updateProfile, updateAvatar } from "@/app/actions";
import { ChevronDown, Loader2, Save, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadImage, deleteSupabaseFile } from "@/utils/supabase-image";
import { AVATARS_BUCKET, getSupabaseImageUrl } from "@/utils/constants";
import { getURL } from "@/lib/utils";
import { buildQRCodeUrl } from "@/lib/qrcode";
import { twMerge } from "tailwind-merge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
const PROFILE_AGE_GROUP_OPTIONS = [
    { value: "under_18", label: "Tenho menos de 18" },
    { value: "18_or_more", label: "Tenho 18 ou mais" },
] as const;
type ProfileAgeGroupValue = (typeof PROFILE_AGE_GROUP_OPTIONS)[number]["value"];

interface Props {
    user: Profile;
    eventId: string;
}

export function ProfileCard({ user, eventId }: Props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formValues, setFormValues] = useState({
        name: user.full_name || "",
        instagram: user.instagram || "",
        tiktok: user.tiktok || "",
        ageGroup: (user.age_group as ProfileAgeGroupValue | null) || "",
    });
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const isLoading = isSaving || isUploadingAvatar;
    const selectedAgeGroupOption = PROFILE_AGE_GROUP_OPTIONS.find((option) => option.value === formValues.ageGroup);

    const resetFormValues = () => {
        setFormValues({
            name: user.full_name || "",
            instagram: user.instagram || "",
            tiktok: user.tiktok || "",
            ageGroup: (user.age_group as ProfileAgeGroupValue | null) || "",
        });
    };

    const handleOpenEditModal = () => {
        resetFormValues();
        setIsEditModalOpen(true);
    };

    const handleEditModalChange = (open = false) => {
        setIsEditModalOpen(open);
        if (!open) {
            resetFormValues();
        }
    };

    const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        const formData = new FormData();
        formData.append("name", formValues.name.trim());
        formData.append("instagram", formValues.instagram.trim());
        formData.append("tiktok", formValues.tiktok.trim());
        formData.append("age_group", formValues.ageGroup);
        formData.append("avatar_url", avatarUrl);

        const result = await updateProfile(formData);
        setIsSaving(false);
        if (result?.error) {
            alert(result.error);
            return;
        }

        setIsEditModalOpen(false);
        router.refresh();
    };

    const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const { path, error } = await uploadImage(file, AVATARS_BUCKET, user.id);

        if (error) {
            alert(error);
            setIsUploadingAvatar(false);
            return;
        }

        if (path) {
            if (avatarUrl) {
                await deleteSupabaseFile(avatarUrl, AVATARS_BUCKET);
            }

            setAvatarUrl(path);
            await updateAvatar(path);
            router.refresh();
        }
        setIsUploadingAvatar(false);
    };

    return (
        <>
            <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
                                {avatarUrl ? (
                                    <Image
                                        src={getSupabaseImageUrl(avatarUrl, AVATARS_BUCKET) || ""}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    user.full_name?.[0]?.toUpperCase() || "U"
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className={twMerge(
                                    "absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                                    isLoading && "cursor-not-allowed opacity-100",
                                )}
                                aria-label="Alterar avatar"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Upload className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user.full_name || "Anônimo"}</h2>
                            <div className="flex flex-col text-sm text-muted-foreground">
                                {user.instagram && (
                                    <a
                                        href={`https://instagram.com/${user.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline"
                                    >
                                        @{user.instagram}
                                    </a>
                                )}
                                {user.tiktok && (
                                    <a
                                        href={`https://tiktok.com/@${user.tiktok}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline"
                                    >
                                        @{user.tiktok} (TikTok)
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="inline-flex items-center rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                        Editar perfil
                    </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="p-4 bg-white rounded-3xl shadow-lg">
                        <QRCodeSVG
                            value={buildQRCodeUrl(getURL(), "user", eventId, user.qr_identifier)}
                            size={200}
                            level="H"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        Escaneie o código um do outro para conectar <br /> e ganharem pontos!
                    </p>
                </div>
            </div>

            <Dialog.Root open={isEditModalOpen} onOpenChange={handleEditModalChange}>
                <Dialog.Portal>
                    <Dialog.Overlay
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        data-slot="profile-edit-overlay"
                    />
                    <Dialog.Content
                        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background p-6 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        data-slot="profile-edit-modal-content"
                    >
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Fechar"
                            >
                                <X className="size-4" />
                            </button>
                        </Dialog.Close>

                        <div className="mb-5 pr-8">
                            <Dialog.Title className="text-lg font-semibold">
                                Editar perfil
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-muted-foreground">
                                Dados para ranking e pessoas que você conheceu
                            </Dialog.Description>
                        </div>

                        <Form.Root
                            className="space-y-4"
                            onSubmit={handleSaveProfile}
                            data-slot="profile-edit-form"
                        >
                            <Form.Field className="space-y-1.5" name="name" data-slot="form-field">
                                <div className="flex items-center justify-between gap-4">
                                    <Form.Label className="text-sm font-medium text-foreground">Nome</Form.Label>
                                    <Form.Message match="valueMissing" className="text-xs text-destructive">
                                        Nome obrigatório
                                    </Form.Message>
                                </div>
                                <Form.Control asChild>
                                    <Input
                                        required
                                        value={formValues.name}
                                        onChange={(event) =>
                                            setFormValues((previousValue) => ({
                                                ...previousValue,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Seu nome"
                                    />
                                </Form.Control>
                            </Form.Field>

                            <Form.Field className="space-y-1.5" name="instagram" data-slot="form-field">
                                <Form.Label className="text-sm font-medium text-foreground">Instagram</Form.Label>
                                <Form.Control asChild>
                                    <Input
                                        value={formValues.instagram}
                                        onChange={(event) =>
                                            setFormValues((previousValue) => ({
                                                ...previousValue,
                                                instagram: event.target.value,
                                            }))
                                        }
                                        placeholder="@seuinstagram"
                                    />
                                </Form.Control>
                            </Form.Field>

                            <Form.Field className="space-y-1.5" name="tiktok" data-slot="form-field">
                                <Form.Label className="text-sm font-medium text-foreground">TikTok</Form.Label>
                                <Form.Control asChild>
                                    <Input
                                        value={formValues.tiktok}
                                        onChange={(event) =>
                                            setFormValues((previousValue) => ({
                                                ...previousValue,
                                                tiktok: event.target.value,
                                            }))
                                        }
                                        placeholder="@seutiktok"
                                    />
                                </Form.Control>
                            </Form.Field>

                            <Form.Field className="space-y-1.5" name="age_group" data-slot="form-field">
                                <Form.Label className="text-sm font-medium text-foreground">Idade</Form.Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between font-normal"
                                            data-slot="age-group-select-trigger"
                                        >
                                            <span
                                                className={twMerge(
                                                    "truncate",
                                                    !selectedAgeGroupOption && "text-muted-foreground",
                                                )}
                                            >
                                                {selectedAgeGroupOption?.label || "Selecione uma opção"}
                                            </span>
                                            <ChevronDown className="size-4 opacity-60" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        sideOffset={6}
                                        className="w-[var(--radix-dropdown-menu-trigger-width)]"
                                        data-slot="age-group-select-content"
                                    >
                                        <DropdownMenuRadioGroup
                                            value={formValues.ageGroup}
                                            onValueChange={(value) =>
                                                setFormValues((previousValue) => ({
                                                    ...previousValue,
                                                    ageGroup: value as ProfileAgeGroupValue,
                                                }))
                                            }
                                        >
                                            {PROFILE_AGE_GROUP_OPTIONS.map((ageGroupOption) => (
                                                <DropdownMenuRadioItem
                                                    key={ageGroupOption.value}
                                                    value={ageGroupOption.value}
                                                >
                                                    {ageGroupOption.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Form.Field>

                            <div className="flex justify-end gap-2 pt-2" data-slot="form-actions">
                                <Dialog.Close asChild>
                                    <Button type="button" variant="outline" disabled={isLoading}>
                                        Cancelar
                                    </Button>
                                </Dialog.Close>
                                <Form.Submit asChild>
                                    <Button type="submit" disabled={isLoading}>
                                        {isSaving ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}
                                        Salvar
                                    </Button>
                                </Form.Submit>
                            </div>
                        </Form.Root>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
