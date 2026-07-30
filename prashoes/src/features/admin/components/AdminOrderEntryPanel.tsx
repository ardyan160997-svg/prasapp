"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminMemberOption,
  AdminOrderEntryData,
  AdminServiceOption,
} from "@/features/admin/types";

type OrderItemForm = {
  shoeDescription: string;
  serviceId: string;
  notes: string;
};

function buildEmptyItem(serviceId: string): OrderItemForm {
  return {
    shoeDescription: "",
    serviceId,
    notes: "",
  };
}

function formatRewardProgress(member: AdminMemberOption) {
  const progress = member.totalDeepCleanPairs % 10;
  return `${progress}/10 Deep Clean`;
}

export default function AdminOrderEntryPanel({
  data,
}: {
  data: AdminOrderEntryData;
}) {
  const router = useRouter();
  const defaultServiceId = data.services[0]?.id ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [ownerType, setOwnerType] = useState<"member" | "non-member">("member");
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<AdminMemberOption | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [items, setItems] = useState<OrderItemForm[]>([buildEmptyItem(defaultServiceId)]);
  const [status, setStatus] = useState("Pesanan dibuat");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return data.members.slice(0, 8);

    return data.members
      .filter((member) =>
        `${member.fullName} ${member.memberCode} ${member.whatsappNumber}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [data.members, memberQuery]);

  function updateItem(index: number, field: keyof OrderItemForm, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, buildEmptyItem(defaultServiceId)]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  function handleSelectMember(member: AdminMemberOption) {
    setSelectedMember(member);
    setMemberQuery(`${member.fullName} - ${member.memberCode}`);
    setCustomerName(member.fullName);
    setWhatsappNumber(member.whatsappNumber);
  }

  function resetForOwnerType(nextOwnerType: "member" | "non-member") {
    setOwnerType(nextOwnerType);
    setMessage("");

    if (nextOwnerType === "non-member") {
      setSelectedMember(null);
      setMemberQuery("");
      setCustomerName("");
      setWhatsappNumber("");
      return;
    }

    setCustomerName(selectedMember?.fullName ?? "");
    setWhatsappNumber(selectedMember?.whatsappNumber ?? "");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanedItems = items.filter(
      (item) => item.shoeDescription.trim() && item.serviceId
    );

    if (ownerType === "member" && !selectedMember) {
      setMessage("Pilih member dari dropdown pencarian terlebih dahulu.");
      return;
    }

    if (!customerName.trim() || !whatsappNumber.trim()) {
      setMessage("Nama customer dan nomor WhatsApp wajib diisi.");
      return;
    }

    if (cleanedItems.length === 0) {
      setMessage("Masukkan minimal satu item sepatu.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerType,
          memberId: selectedMember?.id ?? null,
          customerName,
          whatsappNumber,
          status,
          paymentMethod,
          items: cleanedItems,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error || "Gagal menyimpan order.");
        return;
      }

      setMessage(`Order ${result?.orderCode ?? ""} berhasil dibuat.`);
      setItems([buildEmptyItem(defaultServiceId)]);
      setStatus("Pesanan dibuat");
      setPaymentMethod("COD");

      if (ownerType === "non-member") {
        setCustomerName("");
        setWhatsappNumber("");
      } else if (selectedMember) {
        setCustomerName(selectedMember.fullName);
        setWhatsappNumber(selectedMember.whatsappNumber);
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full flex-col gap-3 text-left md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-yellow-400">
            Input Order Admin
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Catat Sepatu Satu per Satu
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Pilih pemilik sepatu dari member yang sudah terdaftar, atau input manual
            untuk non-member. Setelah tersimpan, admin bisa lanjut upload foto before/after
            per item dari tabel order.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm font-semibold text-zinc-200">
          <span>{isOpen ? "Tutup Form" : "Buka Form"}</span>
          <span
            className={`text-yellow-300 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ^
          </span>
        </div>
      </button>

      {isOpen ? (
      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
            <p className="text-sm font-semibold text-white">Pemilik Sepatu</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => resetForOwnerType("member")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  ownerType === "member"
                    ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-300"
                    : "border-white/10 text-zinc-300 hover:border-yellow-400/30"
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => resetForOwnerType("non-member")}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  ownerType === "non-member"
                    ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-300"
                    : "border-white/10 text-zinc-300 hover:border-yellow-400/30"
                }`}
              >
                Non-member
              </button>
            </div>

            {ownerType === "member" ? (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Cari Member
                </label>
                <input
                  value={memberQuery}
                  onChange={(event) => {
                    setMemberQuery(event.target.value);
                    if (selectedMember) setSelectedMember(null);
                  }}
                  placeholder="Cari nama, kode member, atau nomor WA"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-yellow-400/60"
                />

                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          selectedMember?.id === member.id
                            ? "border-yellow-400/60 bg-yellow-400/10"
                            : "border-white/10 bg-white/[0.02] hover:border-yellow-400/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{member.fullName}</p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {member.memberCode} • {member.whatsappNumber}
                            </p>
                          </div>
                          <div className="text-right text-xs text-zinc-400">
                            <p>{formatRewardProgress(member)}</p>
                            <p className="mt-1 text-emerald-300">
                              Gratis wash: {member.freeWashBalance}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 p-4 text-sm text-zinc-500">
                      Member tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Nama Customer
                </label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  disabled={ownerType === "member" && Boolean(selectedMember)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/60 disabled:opacity-70"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Nomor WhatsApp
                </label>
                <input
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  disabled={ownerType === "member" && Boolean(selectedMember)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/60 disabled:opacity-70"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Status Order
                  </label>
                  <input
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Metode Pembayaran
                  </label>
                  <input
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/60"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Item Sepatu</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Input item satu-satu. Pilih layanan tiap sepatu secara terpisah.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-300 transition-colors hover:bg-yellow-400/20"
              >
                Tambah Item
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <div key={`${index}-${item.serviceId}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Sepatu #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs font-medium text-zinc-500 transition-colors hover:text-red-300"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-300">
                        Keterangan Sepatu
                      </label>
                      <input
                        value={item.shoeDescription}
                        onChange={(event) =>
                          updateItem(index, "shoeDescription", event.target.value)
                        }
                        placeholder="Contoh: Nike Air Force 1 putih, size 42"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-yellow-400/60"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-300">
                        Layanan
                      </label>
                      <select
                        value={item.serviceId}
                        onChange={(event) => updateItem(index, "serviceId", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/60"
                      >
                        {data.services.map((service: AdminServiceOption) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-300">
                        Catatan
                      </label>
                      <textarea
                        value={item.notes}
                        onChange={(event) => updateItem(index, "notes", event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-yellow-400/60"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-zinc-400">
            Reward member dihitung dari item layanan Deep Clean yang dicatat admin.
            Tiap 10x Deep Clean, member mendapat 1x Deep Clean gratis.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Menyimpan Order..." : "Simpan Order"}
          </button>
        </div>

        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </form>
      ) : null}
    </section>
  );
}
