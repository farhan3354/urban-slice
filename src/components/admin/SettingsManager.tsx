"use client";

import * as React from "react";
import {
  Store,
  Phone,
  Clock,
  Truck,
  Megaphone,
  Image as ImageIcon,
  Share2,
  FileText,
  Save,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EmptyState } from "@/components/admin/EmptyState";
import { Loading } from "@/components/admin/Loading";
import { extractErrors, type ApiError } from "@/components/admin/types";
import type {
  DeliveryArea,
  OpeningHour,
  RestaurantSettings,
} from "@/components/admin/settings-types";
import { DAYS, getDayLabel } from "@/components/admin/settings-types";
import { onlyDigits } from "@/lib/format";

type Section =
  | "brand"
  | "contact"
  | "hours"
  | "delivery"
  | "announcement"
  | "hero"
  | "social"
  | "policies";

const SECTIONS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "brand", label: "Brand", icon: Store },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "hero", label: "Hero", icon: ImageIcon },
  { id: "social", label: "Social", icon: Share2 },
  { id: "policies", label: "Policies", icon: FileText },
];

export function SettingsManager() {
  const [settings, setSettings] = React.useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingSection, setSavingSection] = React.useState<Section | null>(null);
  const [errors, setErrors] = React.useState<ApiError[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveSection = async (section: Section, patch: Partial<RestaurantSettings>) => {
    setErrors([]);
    setSavingSection(section);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        setErrors(errs);
        toast.error(errs[0]?.message || "Save failed");
        return;
      }
      setSettings(data.settings);
      toast.success(`${sectionLabel(section)} saved`);
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) return <Loading />;
  if (error || !settings) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load settings"
        description={error || "Please retry."}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your restaurant profile, hours, delivery areas, content and
          policies. Each tab saves independently.
        </p>
      </div>

      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="flex items-center gap-2 data-[state=active]:bg-card"
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="brand" className="mt-4">
          <BrandSection
            settings={settings}
            onSave={(p) => saveSection("brand", p)}
            saving={savingSection === "brand"}
            errors={errors}
          />
        </TabsContent>
        <TabsContent value="contact" className="mt-4">
          <ContactSection
            settings={settings}
            onSave={(p) => saveSection("contact", p)}
            saving={savingSection === "contact"}
            errors={errors}
          />
        </TabsContent>
        <TabsContent value="hours" className="mt-4">
          <HoursSection
            settings={settings}
            onSave={(p) => saveSection("hours", p)}
            saving={savingSection === "hours"}
          />
        </TabsContent>
        <TabsContent value="delivery" className="mt-4">
          <DeliverySection
            settings={settings}
            onSave={(p) => saveSection("delivery", p)}
            saving={savingSection === "delivery"}
            errors={errors}
          />
        </TabsContent>
        <TabsContent value="announcement" className="mt-4">
          <AnnouncementSection
            settings={settings}
            onSave={(p) => saveSection("announcement", p)}
            saving={savingSection === "announcement"}
          />
        </TabsContent>
        <TabsContent value="hero" className="mt-4">
          <HeroSection
            settings={settings}
            onSave={(p) => saveSection("hero", p)}
            saving={savingSection === "hero"}
          />
        </TabsContent>
        <TabsContent value="social" className="mt-4">
          <SocialSection
            settings={settings}
            onSave={(p) => saveSection("social", p)}
            saving={savingSection === "social"}
          />
        </TabsContent>
        <TabsContent value="policies" className="mt-4">
          <PoliciesSection
            settings={settings}
            onSave={(p) => saveSection("policies", p)}
            saving={savingSection === "policies"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function sectionLabel(s: Section) {
  return SECTIONS.find((x) => x.id === s)?.label || s;
}

function SectionShell({
  title,
  description,
  onSave,
  saving,
  children,
}: {
  title: string;
  description: string;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldErr({ errors, field }: { errors: ApiError[]; field: string }) {
  const msg = errors.find((e) => e.field === field)?.message;
  if (!msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

function BrandSection({
  settings,
  onSave,
  saving,
  errors,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
  errors: ApiError[];
}) {
  const [name, setName] = React.useState(settings.restaurantName);
  const [tagline, setTagline] = React.useState(settings.tagline);
  const [logoUrl, setLogoUrl] = React.useState(settings.logoUrl);
  const [footerNote, setFooterNote] = React.useState(settings.footerNote);
  const [currency, setCurrency] = React.useState(settings.currency);

  React.useEffect(() => {
    setName(settings.restaurantName);
    setTagline(settings.tagline);
    setLogoUrl(settings.logoUrl);
    setFooterNote(settings.footerNote);
    setCurrency(settings.currency);
  }, [settings]);

  return (
    <SectionShell
      title="Brand"
      description="Restaurant name, tagline, logo and footer note."
      onSave={() =>
        onSave({ restaurantName: name, tagline, logoUrl, footerNote, currency })
      }
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rs-name">Restaurant name</Label>
          <Input
            id="rs-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldErr errors={errors} field="restaurantName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rs-tagline">Tagline</Label>
          <Input
            id="rs-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rs-currency">Currency</Label>
          <Input
            id="rs-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="PKR"
          />
        </div>
        <div className="md:col-span-2">
          <ImageUpload
            label="Logo"
            value={logoUrl}
            onChange={(url) => setLogoUrl(url || "")}
            aspect="aspect-[3/2]"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="rs-footer">Footer note</Label>
          <Textarea
            id="rs-footer"
            rows={2}
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
          />
        </div>
      </div>
    </SectionShell>
  );
}

function ContactSection({
  settings,
  onSave,
  saving,
  errors,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
  errors: ApiError[];
}) {
  const [address, setAddress] = React.useState(settings.address);
  const [mapLink, setMapLink] = React.useState(settings.mapLink);
  const [whatsapp, setWhatsapp] = React.useState(settings.whatsappNumber);
  const [phone, setPhone] = React.useState(settings.contactPhone);
  const [phoneSecondary, setPhoneSecondary] = React.useState(
    settings.contactPhoneSecondary || ""
  );
  const [email, setEmail] = React.useState(settings.contactEmail);

  React.useEffect(() => {
    setAddress(settings.address);
    setMapLink(settings.mapLink);
    setWhatsapp(settings.whatsappNumber);
    setPhone(settings.contactPhone);
    setPhoneSecondary(settings.contactPhoneSecondary || "");
    setEmail(settings.contactEmail);
  }, [settings]);

  const submit = () => {
    const digits = onlyDigits(whatsapp);
    if (digits && digits.length < 10) {
      toast.error("WhatsApp number must include country code (e.g. 923…)");
      return;
    }
    onSave({
      address,
      mapLink,
      whatsappNumber: digits,
      contactPhone: phone,
      contactPhoneSecondary: phoneSecondary || undefined,
      contactEmail: email,
    });
  };

  return (
    <SectionShell
      title="Contact"
      description="Address, map link, WhatsApp and contact channels."
      onSave={submit}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ct-address">Address</Label>
          <Textarea
            id="ct-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ct-map">Map link</Label>
          <Input
            id="ct-map"
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-wa">WhatsApp number (international digits)</Label>
          <Input
            id="ct-wa"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="923001234567"
            inputMode="tel"
          />
          <p className="text-xs text-muted-foreground">
            Digits only with country code (no +).
          </p>
          <FieldErr errors={errors} field="whatsappNumber" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-phone">Primary contact phone</Label>
          <Input
            id="ct-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0305-2806919"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-phone-secondary">Secondary contact phone (optional)</Label>
          <Input
            id="ct-phone-secondary"
            value={phoneSecondary}
            onChange={(e) => setPhoneSecondary(e.target.value)}
            placeholder="0342-0663919"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ct-email">Contact email</Label>
          <Input
            id="ct-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldErr errors={errors} field="contactEmail" />
        </div>
      </div>
    </SectionShell>
  );
}

function HoursSection({
  settings,
  onSave,
  saving,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
}) {
  const [hours, setHours] = React.useState<OpeningHour[]>(settings.openingHours);
  const [tempClosed, setTempClosed] = React.useState(settings.temporarilyClosed);

  React.useEffect(() => {
    setHours(settings.openingHours);
    setTempClosed(settings.temporarilyClosed);
  }, [settings]);

  // Make sure all 7 days exist
  React.useEffect(() => {
    setHours((prev) => {
      const out: OpeningHour[] = DAYS.map(
        (d) =>
          prev.find((h) => h.day === d) || {
            day: d,
            open: "11:00",
            close: "23:00",
            closed: false,
          },
      );
      return out;
    });
  }, []);

  const updateDay = (day: string, patch: Partial<OpeningHour>) => {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    );
  };

  return (
    <SectionShell
      title="Opening hours"
      description="Weekly opening hours and temporary-close toggle."
      onSave={() => onSave({ openingHours: hours, temporarilyClosed: tempClosed })}
      saving={saving}
    >
      <div className="space-y-2">
        {hours.map((h) => (
          <div
            key={h.day}
            className="grid grid-cols-1 items-center gap-2 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-[100px_1fr_1fr_auto]"
          >
            <Label className="font-medium">{getDayLabel(h.day)}</Label>
            <Input
              type="time"
              value={h.open}
              onChange={(e) => updateDay(h.day, { open: e.target.value })}
              disabled={h.closed}
            />
            <Input
              type="time"
              value={h.close}
              onChange={(e) => updateDay(h.day, { close: e.target.value })}
              disabled={h.closed}
            />
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`closed-${h.day}`}
                className="text-xs text-muted-foreground"
              >
                Closed
              </Label>
              <Switch
                id={`closed-${h.day}`}
                checked={h.closed}
                onCheckedChange={(v) => updateDay(h.day, { closed: v })}
              />
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-amber-900">
            Temporarily closed
          </p>
          <p className="text-xs text-amber-800/80">
            Override hours — site shows “Temporarily closed” everywhere.
          </p>
        </div>
        <Switch
          checked={tempClosed}
          onCheckedChange={setTempClosed}
        />
      </div>
    </SectionShell>
  );
}

function DeliverySection({
  settings,
  onSave,
  saving,
  errors,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
  errors: ApiError[];
}) {
  const [areas, setAreas] = React.useState<DeliveryArea[]>(
    settings.deliveryAreas,
  );
  const [defaultFee, setDefaultFee] = React.useState(
    String(settings.defaultDeliveryFee),
  );
  const [minOrder, setMinOrder] = React.useState(
    String(settings.minOrderValue),
  );
  const [freeThreshold, setFreeThreshold] = React.useState(
    String(settings.freeDeliveryThreshold),
  );
  const [prepTime, setPrepTime] = React.useState(String(settings.prepTimeMin));

  React.useEffect(() => {
    setAreas(settings.deliveryAreas);
    setDefaultFee(String(settings.defaultDeliveryFee));
    setMinOrder(String(settings.minOrderValue));
    setFreeThreshold(String(settings.freeDeliveryThreshold));
    setPrepTime(String(settings.prepTimeMin));
  }, [settings]);

  const updateArea = (i: number, patch: Partial<DeliveryArea>) => {
    setAreas((prev) =>
      prev.map((a, j) => (j === i ? { ...a, ...patch } : a)),
    );
  };
  const addArea = () =>
    setAreas((prev) => [...prev, { name: "", fee: 0, etaMin: 25 }]);
  const removeArea = (i: number) =>
    setAreas((prev) => prev.filter((_, j) => j !== i));

  return (
    <SectionShell
      title="Delivery"
      description="Delivery areas, fees, minimum order, free-delivery threshold."
      onSave={() =>
        onSave({
          deliveryAreas: areas,
          defaultDeliveryFee: parseFloat(defaultFee) || 0,
          minOrderValue: parseFloat(minOrder) || 0,
          freeDeliveryThreshold: parseFloat(freeThreshold) || 0,
          prepTimeMin: parseInt(prepTime, 10) || 0,
        })
      }
      saving={saving}
    >
      <div className="space-y-2">
        {areas.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-1 items-center gap-2 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_120px_120px_auto]"
          >
            <Input
              value={a.name}
              onChange={(e) => updateArea(i, { name: e.target.value })}
              placeholder="Area name"
            />
            <div>
              <Label className="sr-only">Fee</Label>
              <Input
                type="number"
                step="0.01"
                value={a.fee}
                onChange={(e) =>
                  updateArea(i, { fee: parseFloat(e.target.value) || 0 })
                }
                placeholder="Fee Rs."
              />
            </div>
            <div>
              <Label className="sr-only">ETA</Label>
              <Input
                type="number"
                value={a.etaMin}
                onChange={(e) =>
                  updateArea(i, { etaMin: parseInt(e.target.value, 10) || 0 })
                }
                placeholder="ETA min"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => removeArea(i)}
              aria-label="Remove area"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addArea}>
          <Plus className="size-4" />
          Add area
        </Button>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dl-default">Default delivery fee (Rs.)</Label>
          <Input
            id="dl-default"
            type="number"
            step="0.01"
            value={defaultFee}
            onChange={(e) => setDefaultFee(e.target.value)}
          />
          <FieldErr errors={errors} field="defaultDeliveryFee" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dl-min">Min order value (Rs.)</Label>
          <Input
            id="dl-min"
            type="number"
            step="0.01"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dl-free">Free delivery threshold (Rs.)</Label>
          <Input
            id="dl-free"
            type="number"
            step="0.01"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dl-prep">Prep time (min)</Label>
          <Input
            id="dl-prep"
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
          />
        </div>
      </div>
    </SectionShell>
  );
}

function AnnouncementSection({
  settings,
  onSave,
  saving,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
}) {
  const ab = settings.announcementBar;
  const [enabled, setEnabled] = React.useState(ab.enabled);
  const [text, setText] = React.useState(ab.text);
  const [link, setLink] = React.useState(ab.link || "");

  React.useEffect(() => {
    setEnabled(ab.enabled);
    setText(ab.text);
    setLink(ab.link || "");
  }, [ab.enabled, ab.text, ab.link]);

  return (
    <SectionShell
      title="Announcement bar"
      description="The slim banner shown above the website header."
      onSave={() =>
        onSave({
          announcementBar: {
            enabled,
            text,
            link: link || undefined,
          },
        })
      }
      saving={saving}
    >
      <div className="space-y-4">
        <SwitchRow
          label="Enabled"
          description="Show the announcement bar at the top of the site."
          checked={enabled}
          onChange={setEnabled}
        />
        <div className="space-y-1.5">
          <Label htmlFor="ab-text">Text</Label>
          <Textarea
            id="ab-text"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="🎁 Free delivery on orders above Rs. 2500…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ab-link">Link (optional)</Label>
          <Input
            id="ab-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/deals"
          />
        </div>
      </div>
    </SectionShell>
  );
}

function HeroSection({
  settings,
  onSave,
  saving,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
}) {
  const h = settings.hero;
  const [headline, setHeadline] = React.useState(h.headline);
  const [subheadline, setSubheadline] = React.useState(h.subheadline);
  const [primaryCta, setPrimaryCta] = React.useState(h.primaryCta);
  const [secondaryCta, setSecondaryCta] = React.useState(h.secondaryCta);
  const [imageUrl, setImageUrl] = React.useState(h.imageUrl);

  React.useEffect(() => {
    setHeadline(h.headline);
    setSubheadline(h.subheadline);
    setPrimaryCta(h.primaryCta);
    setSecondaryCta(h.secondaryCta);
    setImageUrl(h.imageUrl);
  }, [h.headline, h.subheadline, h.primaryCta, h.secondaryCta, h.imageUrl]);

  return (
    <SectionShell
      title="Hero"
      description="Homepage hero: headline, subheadline, CTAs and background image."
      onSave={() =>
        onSave({
          hero: { headline, subheadline, primaryCta, secondaryCta, imageUrl },
        })
      }
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="hr-headline">Headline</Label>
          <Input
            id="hr-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="hr-sub">Subheadline</Label>
          <Textarea
            id="hr-sub"
            rows={3}
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hr-cta1">Primary CTA</Label>
          <Input
            id="hr-cta1"
            value={primaryCta}
            onChange={(e) => setPrimaryCta(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hr-cta2">Secondary CTA</Label>
          <Input
            id="hr-cta2"
            value={secondaryCta}
            onChange={(e) => setSecondaryCta(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <ImageUpload
            label="Hero image"
            value={imageUrl}
            onChange={(url) => setImageUrl(url || "")}
            aspect="aspect-[16/9]"
          />
        </div>
      </div>
    </SectionShell>
  );
}

function SocialSection({
  settings,
  onSave,
  saving,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
}) {
  const s = settings.social;
  const [facebook, setFacebook] = React.useState(s.facebook || "");
  const [instagram, setInstagram] = React.useState(s.instagram || "");
  const [tiktok, setTiktok] = React.useState(s.tiktok || "");
  const [youtube, setYoutube] = React.useState(s.youtube || "");

  React.useEffect(() => {
    setFacebook(s.facebook || "");
    setInstagram(s.instagram || "");
    setTiktok(s.tiktok || "");
    setYoutube(s.youtube || "");
  }, [s.facebook, s.instagram, s.tiktok, s.youtube]);

  return (
    <SectionShell
      title="Social links"
      description="Public social profile links shown in the footer."
      onSave={() =>
        onSave({
          social: { facebook, instagram, tiktok, youtube },
        })
      }
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="so-fb">Facebook</Label>
          <Input
            id="so-fb"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="so-ig">Instagram</Label>
          <Input
            id="so-ig"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="so-tt">TikTok</Label>
          <Input
            id="so-tt"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="so-yt">YouTube</Label>
          <Input
            id="so-yt"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/@…"
          />
        </div>
      </div>
    </SectionShell>
  );
}

function PoliciesSection({
  settings,
  onSave,
  saving,
}: {
  settings: RestaurantSettings;
  onSave: (p: Partial<RestaurantSettings>) => void;
  saving: boolean;
}) {
  const p = settings.policies;
  const [about, setAbout] = React.useState(p.about);
  const [deliveryInfo, setDeliveryInfo] = React.useState(p.deliveryInfo);
  const [refundPolicy, setRefundPolicy] = React.useState(p.refundPolicy);
  const [privacyPolicy, setPrivacyPolicy] = React.useState(p.privacyPolicy);
  const [terms, setTerms] = React.useState(p.terms);

  React.useEffect(() => {
    setAbout(p.about);
    setDeliveryInfo(p.deliveryInfo);
    setRefundPolicy(p.refundPolicy);
    setPrivacyPolicy(p.privacyPolicy);
    setTerms(p.terms);
  }, [p.about, p.deliveryInfo, p.refundPolicy, p.privacyPolicy, p.terms]);

  return (
    <SectionShell
      title="Policies & content"
      description="Long-form content displayed on /about, /delivery, /refund, /privacy, /terms."
      onSave={() =>
        onSave({
          policies: { about, deliveryInfo, refundPolicy, privacyPolicy, terms },
        })
      }
      saving={saving}
    >
      <div className="space-y-4">
        <PolicyField label="About" value={about} onChange={setAbout} />
        <PolicyField
          label="Delivery info"
          value={deliveryInfo}
          onChange={setDeliveryInfo}
        />
        <PolicyField
          label="Refund policy"
          value={refundPolicy}
          onChange={setRefundPolicy}
        />
        <PolicyField
          label="Privacy policy"
          value={privacyPolicy}
          onChange={setPrivacyPolicy}
        />
        <PolicyField label="Terms of service" value={terms} onChange={setTerms} />
      </div>
    </SectionShell>
  );
}

function PolicyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
