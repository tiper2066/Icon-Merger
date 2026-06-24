"use client";

import {
  ChevronDown,
  Palette,
  Settings2,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { IconType } from "@/generated/prisma/enums";

const iconColorOptions = [
  { label: "1번 색상", value: "#0060A9" },
  { label: "2번 색상", value: "#302BCF" },
  { label: "3번 색상", value: "#0C73EF" },
  { label: "4번 색상", value: "#2DA6FA" },
  { label: "5번 색상", value: "#5DD6D5" },
  { label: "6번 색상", value: "#DD524C" },
  { label: "7번 색상", value: "#FECC09" },
  { label: "8번 색상", value: "#999B9E" },
  { label: "9번 색상", value: "#000000" },
  { label: "10번 색상", value: "#FFFFFF" },
];

type IconTypeValue = (typeof IconType)[keyof typeof IconType];
type UploadType = typeof IconType.MAIN | typeof IconType.MERGE_ICON | typeof IconType.MERGE_TEXT;

export type WorkspaceIcon = {
  id: string;
  name: string;
  type: IconTypeValue;
  svgContent: string;
  width: number;
  height: number;
  anchorX: number | null;
  anchorY: number | null;
};

type IconWorkspaceProps = {
  user: {
    name: string | null;
    email: string;
  };
  icons: WorkspaceIcon[];
};

type SelectedIconIds = Record<IconTypeValue, string[]>;

const emptySelectedIconIds: SelectedIconIds = {
  [IconType.MAIN]: [],
  [IconType.MERGE_ICON]: [],
  [IconType.MERGE_TEXT]: [],
};

export function IconWorkspace({ user, icons }: IconWorkspaceProps) {
  const router = useRouter();
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const [selectedIconIds, setSelectedIconIds] = useState<SelectedIconIds>(
    emptySelectedIconIds,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: IconTypeValue;
    title: string;
  } | null>(null);
  const [deletingType, setDeletingType] = useState<IconTypeValue | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const mainIcons = useMemo(
    () => icons.filter((icon) => icon.type === IconType.MAIN),
    [icons],
  );
  const mergeIcons = useMemo(
    () => icons.filter((icon) => icon.type === IconType.MERGE_ICON),
    [icons],
  );
  const mergeTexts = useMemo(
    () => icons.filter((icon) => icon.type === IconType.MERGE_TEXT),
    [icons],
  );

  function toggleIconSelection(type: IconTypeValue, iconId: string) {
    setSelectedIconIds((currentSelection) => {
      const selectedIds = currentSelection[type];

      return {
        ...currentSelection,
        [type]: selectedIds.includes(iconId)
          ? selectedIds.filter((id) => id !== iconId)
          : [...selectedIds, iconId],
      };
    });
  }

  function selectAllIcons(type: IconTypeValue, targetIcons: WorkspaceIcon[]) {
    setSelectedIconIds((currentSelection) => ({
      ...currentSelection,
      [type]: targetIcons.map((icon) => icon.id),
    }));
  }

  function clearIconSelection(type: IconTypeValue) {
    setSelectedIconIds((currentSelection) => ({
      ...currentSelection,
      [type]: [],
    }));
  }

  function requestDeleteSelected(type: IconTypeValue, title: string) {
    if (selectedIconIds[type].length === 0) {
      return;
    }

    setDeleteError(null);
    setDeleteConfirmation({ type, title });
  }

  async function confirmDeleteSelected() {
    if (!deleteConfirmation) {
      return;
    }

    const { type } = deleteConfirmation;
    const ids = selectedIconIds[type];

    if (ids.length === 0) {
      setDeleteConfirmation(null);
      return;
    }

    setDeletingType(type);
    setDeleteError(null);

    try {
      const response = await fetch("/api/icons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDeleteError(data.error ?? "선택한 아이콘 삭제에 실패했습니다.");
        return;
      }

      clearIconSelection(type);
      setDeleteConfirmation(null);
      router.refresh();
    } finally {
      setDeletingType(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#111620]">
      <header className="flex min-h-16 items-center justify-between border-b border-[#D9DCE3] bg-white px-8">
        <div>
          <p className="text-xs font-medium tracking-[0.25px] text-[#1E6FFF]">
            ICON Merger
          </p>
          <h1 className="text-xl font-semibold leading-7 text-[#111620]">
            SVG 아이콘 작업 공간
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="font-medium text-[#111620]">
              {user.name ?? "허용된 사용자"}
            </span>
            <span className="text-[#545D70]">{user.email}</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[minmax(196px,0.8fr)_minmax(440px,2fr)_minmax(300px,1fr)] gap-6 p-6">
        <IconPanel
          title="메인 아이콘"
          description="병합 기준점이 저장되는 원본 아이콘입니다."
          actionLabel="메인 추가"
          emptyTitle="메인 아이콘이 없습니다"
          emptyDescription="SVG 업로드 후 이곳에 메인 아이콘이 표시됩니다."
          icons={mainIcons}
          layout="list"
          selectedIds={selectedIconIds[IconType.MAIN]}
          isDeleting={deletingType === IconType.MAIN}
          onAdd={() => setUploadType(IconType.MAIN)}
          onClearSelection={() => clearIconSelection(IconType.MAIN)}
          onDeleteSelected={() => requestDeleteSelected(IconType.MAIN, "메인 아이콘")}
          onSelectAll={() => selectAllIcons(IconType.MAIN, mainIcons)}
          onToggleIcon={(iconId) => toggleIconSelection(IconType.MAIN, iconId)}
        />

        <section className="flex min-w-0 flex-col gap-6">
          <ResourceSection
            title="병합용 아이콘"
            description="메인 아이콘의 절단 영역에 붙일 아이콘 리소스입니다."
            actionLabel="아이콘 추가"
            emptyTitle="병합용 아이콘이 없습니다"
            emptyDescription="업로드 후 여러 아이콘 중 하나를 선택할 수 있습니다."
            icons={mergeIcons}
            selectedIds={selectedIconIds[IconType.MERGE_ICON]}
            isDeleting={deletingType === IconType.MERGE_ICON}
            onAdd={() => setUploadType(IconType.MERGE_ICON)}
            onClearSelection={() => clearIconSelection(IconType.MERGE_ICON)}
            onDeleteSelected={() => requestDeleteSelected(IconType.MERGE_ICON, "병합용 아이콘")}
            onSelectAll={() => selectAllIcons(IconType.MERGE_ICON, mergeIcons)}
            onToggleIcon={(iconId) => toggleIconSelection(IconType.MERGE_ICON, iconId)}
          />
          <ResourceSection
            title="텍스트 SVG"
            description="문자나 라벨 형태의 SVG 리소스입니다."
            actionLabel="텍스트 추가"
            emptyTitle="텍스트 SVG가 없습니다"
            emptyDescription="텍스트 SVG를 업로드하면 별도 섹션으로 관리됩니다."
            icons={mergeTexts}
            iconKind="text"
            selectedIds={selectedIconIds[IconType.MERGE_TEXT]}
            isDeleting={deletingType === IconType.MERGE_TEXT}
            onAdd={() => setUploadType(IconType.MERGE_TEXT)}
            onClearSelection={() => clearIconSelection(IconType.MERGE_TEXT)}
            onDeleteSelected={() => requestDeleteSelected(IconType.MERGE_TEXT, "텍스트 SVG")}
            onSelectAll={() => selectAllIcons(IconType.MERGE_TEXT, mergeTexts)}
            onToggleIcon={(iconId) => toggleIconSelection(IconType.MERGE_TEXT, iconId)}
          />
        </section>

        <PropertiesPanel />
      </div>

      {uploadType ? (
        <UploadDialog
          type={uploadType}
          onClose={() => setUploadType(null)}
        />
      ) : null}
      {deleteConfirmation ? (
        <DeleteConfirmDialog
          errorMessage={deleteError}
          isDeleting={deletingType === deleteConfirmation.type}
          selectedCount={selectedIconIds[deleteConfirmation.type].length}
          title={deleteConfirmation.title}
          onCancel={() => {
            if (!deletingType) {
              setDeleteConfirmation(null);
              setDeleteError(null);
            }
          }}
          onConfirm={confirmDeleteSelected}
        />
      ) : null}
    </main>
  );
}

type IconPanelProps = {
  title: string;
  description: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  icons: WorkspaceIcon[];
  selectedIds: string[];
  isDeleting: boolean;
  onAdd: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onToggleIcon: (iconId: string) => void;
  layout?: "list" | "grid";
  iconKind?: "icon" | "text";
};

function IconPanel({
  title,
  description,
  actionLabel,
  emptyTitle,
  emptyDescription,
  icons,
  selectedIds,
  isDeleting,
  onAdd,
  onClearSelection,
  onDeleteSelected,
  onSelectAll,
  onToggleIcon,
  layout = "grid",
  iconKind = "icon",
}: IconPanelProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col rounded-[16px] border border-[#ECEEF2] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <SectionHeader
        title={title}
        description={description}
        actionLabel={actionLabel}
        selectedCount={selectedIds.length}
        totalCount={icons.length}
        isDeleting={isDeleting}
        onAdd={onAdd}
        onClearSelection={onClearSelection}
        onDeleteSelected={onDeleteSelected}
        onSelectAll={onSelectAll}
      />

      <div
        className={
          layout === "list"
            ? "mt-5 grid grid-cols-2 gap-3 overflow-y-auto"
            : iconKind === "text"
              ? "mt-5 flex flex-wrap items-start gap-4 overflow-y-auto"
              : "mt-5 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-4 overflow-y-auto"
        }
      >
        {icons.length > 0 ? (
          icons.map((icon) => (
            <IconCard
              key={icon.id}
              icon={icon}
              isSelected={selectedIds.includes(icon.id)}
              kind={iconKind}
              layout={layout}
              onToggle={() => onToggleIcon(icon.id)}
            />
          ))
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            kind={iconKind}
          />
        )}
      </div>
    </section>
  );
}

function ResourceSection(props: Omit<IconPanelProps, "layout">) {
  return <IconPanel {...props} layout="grid" />;
}

type SectionHeaderProps = {
  title: string;
  description: string;
  actionLabel: string;
  selectedCount: number;
  totalCount: number;
  isDeleting: boolean;
  onAdd: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
};

function SectionHeader({
  title,
  description,
  actionLabel,
  selectedCount,
  totalCount,
  isDeleting,
  onAdd,
  onClearSelection,
  onDeleteSelected,
  onSelectAll,
}: SectionHeaderProps) {
  const hasSelection = selectedCount > 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: globalThis.PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-7 text-[#111620]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#545D70]">
            {description}
          </p>
        </div>
        <Button size="sm" type="button" onClick={onAdd}>
          {actionLabel}
        </Button>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3">
        {hasSelection ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EBF2FF] px-3 py-1 text-xs font-semibold tracking-[0.25px] text-[#124199]">
              {selectedCount}개 선택됨
            </span>
            <Button size="sm" variant="ghost" type="button" onClick={onClearSelection}>
              선택 해제
            </Button>
            <Button
              disabled={isDeleting}
              size="sm"
              variant="destructive"
              type="button"
              onClick={onDeleteSelected}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        ) : (
          <p className="text-xs leading-4 text-[#747E93]">
            항목 선택 후 선택 해제와 삭제 액션이 표시됩니다.
          </p>
        )}

        <div ref={menuRef} className="relative">
          <Button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            더보기
          </Button>
          {isMenuOpen ? (
            <div
              className="absolute right-0 top-9 z-20 w-36 rounded-[10px] border border-[#D9DCE3] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              role="menu"
            >
              <button
                className="flex w-full cursor-pointer items-center rounded-[8px] px-3 py-2 text-left text-sm font-medium text-[#111620] hover:bg-[#EBF2FF] disabled:cursor-not-allowed disabled:text-[#9AA3B5] disabled:hover:bg-transparent"
                disabled={totalCount === 0 || isAllSelected}
                role="menuitem"
                type="button"
                onClick={() => {
                  onSelectAll();
                  setIsMenuOpen(false);
                }}
              >
                {isAllSelected ? "전체 선택됨" : "전체 선택"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type IconCardProps = {
  icon: WorkspaceIcon;
  isSelected: boolean;
  layout: "list" | "grid";
  kind: "icon" | "text";
  onToggle: () => void;
};

function IconCard({ icon, isSelected, layout, kind, onToggle }: IconCardProps) {
  const isList = layout === "list";
  const isText = kind === "text";
  const cardStyle =
    isText
      ? { width: `${getTextCardWidth(icon)}px` }
      : undefined;
  const cardClassName = isText
    ? isSelected
      ? "group relative flex h-[88px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] border-2 border-[#1E6FFF] bg-[#EBF2FF] p-3 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20"
      : "group relative flex h-[88px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-[#D9DCE3] bg-white p-3 transition hover:border-[#99BFFF] hover:bg-[#EBF2FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20"
    : isSelected
      ? "group relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-[12px] border-2 border-[#1E6FFF] bg-[#EBF2FF] p-3 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20"
      : "group relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-[12px] border border-[#D9DCE3] bg-white p-3 transition hover:border-[#99BFFF] hover:bg-[#EBF2FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20";

  return (
    <IconTooltip content={icon.name} fullWidth={!isText}>
      <button
        aria-label={icon.name}
        aria-pressed={isSelected}
        className={cardClassName}
        style={cardStyle}
        type="button"
        onClick={onToggle}
      >
        <IconPreview icon={icon} kind={kind} compact={isList} />
      </button>
    </IconTooltip>
  );
}

type IconPreviewProps = {
  icon: WorkspaceIcon;
  kind: "icon" | "text";
  compact?: boolean;
};

function IconPreview({ icon, kind, compact = false }: IconPreviewProps) {
  const iconSizeClass =
    kind === "text"
      ? "[&_svg]:h-10 [&_svg]:w-auto [&_svg]:max-w-full"
      : "[&_svg]:h-10 [&_svg]:w-10";
  const lineIconClass =
    kind === "icon"
      ? "text-[#111620] [&_svg_*]:fill-none [&_svg_*]:stroke-current"
      : "text-[#111620]";
  const surfaceClass = compact ? "bg-[#F7F8FA]" : "bg-transparent";

  return (
    <div className={`flex size-full items-center justify-center rounded-[10px] ${surfaceClass}`}>
      {icon.svgContent ? (
        <div
          aria-hidden="true"
          className={`flex items-center justify-center ${iconSizeClass} ${lineIconClass}`}
          dangerouslySetInnerHTML={{ __html: icon.svgContent }}
        />
      ) : kind === "text" ? (
        <Type aria-hidden="true" className="size-6" />
      ) : (
        <Settings2 aria-hidden="true" className="size-6" />
      )}
    </div>
  );
}

type IconTooltipProps = {
  content: string;
  children: ReactNode;
  fullWidth?: boolean;
};

function IconTooltip({ content, children, fullWidth = true }: IconTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  function showTooltip() {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 8,
    });
    setIsVisible(true);
  }

  return (
    <span
      ref={triggerRef}
      className={fullWidth ? "relative inline-flex w-full" : "relative inline-flex shrink-0"}
      onBlur={() => setIsVisible(false)}
      onFocus={showTooltip}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible ? (
        <span
          className="pointer-events-none fixed z-50 max-w-48 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#111620] px-3 py-2 text-xs font-medium leading-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
          role="tooltip"
          style={{
            left: position.left,
            top: position.top,
          }}
        >
          {content}
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#111620]" />
        </span>
      ) : null}
    </span>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  kind: "icon" | "text";
};

function EmptyState({ title, description, kind }: EmptyStateProps) {
  return (
    <div className="col-span-full flex min-h-48 flex-col items-center justify-center rounded-[12px] border border-dashed border-[#BFC4CF] bg-[#F7F8FA] px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#EBF2FF] text-[#1E6FFF]">
        {kind === "text" ? (
          <Type aria-hidden="true" className="size-5" />
        ) : (
          <Settings2 aria-hidden="true" className="size-5" />
        )}
      </div>
      <h3 className="mt-4 text-sm font-semibold leading-5 text-[#111620]">
        {title}
      </h3>
      <p className="mt-2 max-w-56 text-sm leading-5 text-[#545D70]">
        {description}
      </p>
    </div>
  );
}

type DeleteConfirmDialogProps = {
  title: string;
  selectedCount: number;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConfirmDialog({
  title,
  selectedCount,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111620]/40 px-6">
      <section
        aria-labelledby="delete-confirm-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2] text-[#EF4444]">
            <Trash2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-xl font-semibold leading-7 text-[#111620]"
              id="delete-confirm-title"
            >
              선택한 {title} 삭제
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#545D70]">
              선택한 {selectedCount}개 항목을 삭제합니다. 삭제한 SVG 리소스는 되돌릴 수 없습니다.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={isDeleting}
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            disabled={isDeleting}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function UploadDialog({
  type,
  onClose,
}: {
  type: UploadType;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const anchorStageRef = useRef<HTMLDivElement>(null);
  const anchorImageRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [anchorX, setAnchorX] = useState("");
  const [anchorY, setAnchorY] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const isMain = type === IconType.MAIN;
  const copy = getUploadCopy(type);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const anchorPosition = useMemo(() => {
    const x = Number(anchorX);
    const y = Number(anchorY);

    if (!previewSize || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return {
      left: `${Math.min(Math.max((x / previewSize.width) * 100, 0), 100)}%`,
      top: `${Math.min(Math.max((y / previewSize.height) * 100, 0), 100)}%`,
    };
  }, [anchorX, anchorY, previewSize]);

  function updateAnchorFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (!previewSize || !anchorStageRef.current) {
      return;
    }

    const imageRect =
      anchorImageRef.current?.getBoundingClientRect() ??
      getContainedRect(anchorStageRef.current.getBoundingClientRect(), previewSize);
    const x = clamp(
      ((event.clientX - imageRect.left) / imageRect.width) * previewSize.width,
      0,
      previewSize.width,
    );
    const y = clamp(
      ((event.clientY - imageRect.top) / imageRect.height) * previewSize.height,
      0,
      previewSize.height,
    );

    setAnchorX(formatCoordinate(x));
    setAnchorY(formatCoordinate(y));
  }

  function handleAnchorPointerDown(event: PointerEvent<HTMLDivElement>) {
    updateAnchorFromPointer(event);
    setIsDraggingAnchor(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleAnchorPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (isDraggingAnchor) {
      updateAnchorFromPointer(event);
    }
  }

  function handleAnchorPointerUp(event: PointerEvent<HTMLDivElement>) {
    setIsDraggingAnchor(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function setSelectedFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList);

    if (nextFiles.length === 0) {
      clearSelectedFiles();
      return;
    }

    const invalidFile = nextFiles.find((file) => !isClientSvgFile(file));

    if (invalidFile) {
      clearSelectedFiles();
      setErrorMessage(`${invalidFile.name}은 SVG 파일이 아닙니다. SVG 파일만 선택해 주세요.`);
      return;
    }

    if (isMain && nextFiles.length > 1) {
      clearSelectedFiles();
      setErrorMessage("메인 아이콘은 SVG 1개만 선택할 수 있습니다.");
      return;
    }

    const selectedFiles = isMain ? nextFiles.slice(0, 1) : nextFiles;

    setFiles(selectedFiles);
    setErrorMessage(null);
    clearPreview();

    if (!isMain || selectedFiles.length === 0) {
      setPreviewUrl(null);
      setPreviewSize(null);
      return;
    }

    const file = selectedFiles[0];
    const objectUrl = URL.createObjectURL(file);

    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    file.text().then((svg) => {
      setPreviewSize(readClientSvgSize(svg));
    });
  }

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  function clearSelectedFiles() {
    clearPreview();
    setFiles([]);
    setPreviewUrl(null);
    setPreviewSize(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    setSelectedFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (files.length === 0) {
      setErrorMessage("업로드할 SVG 파일을 선택해 주세요.");
      return;
    }

    if (isMain && (!anchorX || !anchorY)) {
      setErrorMessage("메인 아이콘은 anchorX와 anchorY 좌표가 필요합니다.");
      return;
    }

    const formData = new FormData();

    formData.append("type", type);
    files.forEach((file) => formData.append("files", file));

    if (isMain) {
      formData.append("anchorX", anchorX);
      formData.append("anchorY", anchorY);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/icons", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? "SVG 업로드에 실패했습니다.");
        return;
      }

      router.refresh();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111620]/40 px-6">
      <form
        className="w-full max-w-xl rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold leading-7 text-[#111620]">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-[#545D70]">
              SVG 파일만 업로드할 수 있으며 최대 256KB까지 허용됩니다.
            </p>
          </div>
          <Button size="sm" type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div
          className={
            isDragging
              ? "mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#1E6FFF] bg-[#EBF2FF] px-6 py-8 text-center"
              : "mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#BFC4CF] bg-[#F7F8FA] px-6 py-8 text-center"
          }
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <UploadCloud aria-hidden="true" className="size-8 text-[#1E6FFF]" />
          <p className="mt-3 text-sm font-semibold text-[#111620]">
            파일을 드래그하거나 클릭하여 선택
          </p>
          <p className="mt-1 text-xs text-[#545D70]">
            {copy.policy}
          </p>
          <input
            ref={fileInputRef}
            accept=".svg,image/svg+xml"
            className="hidden"
            multiple={!isMain}
            onChange={handleInputChange}
            type="file"
          />
        </div>

        {files.length > 0 ? (
          <div className="mt-4 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-3">
            <p className="text-xs font-semibold tracking-[0.25px] text-[#545D70]">
              선택된 파일
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#111620]">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isMain ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
            <div
              ref={anchorStageRef}
              className="relative flex min-h-56 touch-none select-none items-center justify-center overflow-hidden rounded-[12px] border border-[#D9DCE3] bg-[#F7F8FA] p-4"
              onPointerDown={previewUrl && previewSize ? handleAnchorPointerDown : undefined}
              onPointerMove={previewUrl && previewSize ? handleAnchorPointerMove : undefined}
              onPointerUp={previewUrl && previewSize ? handleAnchorPointerUp : undefined}
              onPointerCancel={previewUrl && previewSize ? handleAnchorPointerUp : undefined}
              role="presentation"
              style={{
                cursor: previewUrl && previewSize
                  ? isDraggingAnchor
                    ? "grabbing"
                    : "crosshair"
                  : "default",
              }}
            >
              {previewUrl && previewSize ? (
                <div
                  ref={anchorImageRef}
                  className="pointer-events-none relative h-48 max-w-full"
                  style={{
                    aspectRatio: `${previewSize.width} / ${previewSize.height}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="메인 아이콘 업로드 미리보기"
                    className="absolute inset-0 h-full w-full select-none object-contain"
                    draggable={false}
                    src={previewUrl}
                  />
                  {anchorPosition ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1E6FFF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] before:absolute before:left-1/2 before:top-[-10px] before:h-8 before:w-px before:-translate-x-1/2 before:bg-[#1E6FFF] after:absolute after:left-[-10px] after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-[#1E6FFF]"
                      style={anchorPosition}
                    />
                  ) : null}
                </div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="메인 아이콘 업로드 미리보기"
                  className="h-48 w-full select-none object-contain"
                  draggable={false}
                  src={previewUrl}
                />
              ) : (
                <p className="text-sm text-[#747E93]">SVG 선택 시 미리보기가 표시됩니다.</p>
              )}
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-[#545D70]">anchorX</span>
                <input
                  className="mt-1 h-11 w-full rounded-[8px] border border-[#D9DCE3] px-3 text-sm outline-none focus:border-[#1E6FFF]"
                  min="0"
                  onChange={(event) => setAnchorX(event.target.value)}
                  placeholder="0"
                  step="0.5"
                  type="number"
                  value={anchorX}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#545D70]">anchorY</span>
                <input
                  className="mt-1 h-11 w-full rounded-[8px] border border-[#D9DCE3] px-3 text-sm outline-none focus:border-[#1E6FFF]"
                  min="0"
                  onChange={(event) => setAnchorY(event.target.value)}
                  placeholder="0"
                  step="0.5"
                  type="number"
                  value={anchorY}
                />
              </label>
              <p className="text-xs leading-4 text-[#747E93]">
                미리보기 아이콘 위를 클릭하거나 드래그해 anchor 좌표를 설정할 수 있습니다.
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "업로드 중..." : "업로드"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PropertiesPanel() {
  return (
    <aside className="flex min-h-0 flex-col rounded-[16px] border border-[#ECEEF2] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold leading-7 text-[#111620]">
            아이콘 속성
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#545D70]">
            색상, 두께, 크기를 조정할 수 있습니다.
          </p>
        </div>
        <Button size="sm" type="button" variant="ghost" aria-label="초기화">
          초기화
        </Button>
      </div>

      <div className="mt-6 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-4">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
          <PreviewTile label="메인" />
          <span className="text-sm font-semibold text-[#747E93]">+</span>
          <PreviewTile label="리소스" />
          <span className="text-sm font-semibold text-[#747E93]">=</span>
          <PreviewTile label="결과" active />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <PropertyGroup
          icon={<Palette aria-hidden="true" className="size-4" />}
          title="색상"
          description="문서 기준 10개 색상을 제공합니다."
        >
          <div className="grid grid-cols-5 gap-2">
            {iconColorOptions.map((color) => (
              <span
                key={color.value}
                aria-label={`${color.label} ${color.value}`}
                className="size-8 rounded-[8px] border border-[#D9DCE3]"
                role="img"
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    color.value === "#FFFFFF" ? "#E5E7EB" : undefined,
                }}
              />
            ))}
          </div>
        </PropertyGroup>

        <PropertyGroup
          icon={<Settings2 aria-hidden="true" className="size-4" />}
          title="선 두께"
          description="0.5px 단위 조정은 후속 단계에서 연결합니다."
        >
          <div className="h-2 rounded-full bg-[#ECEEF2]">
            <div className="h-2 w-1/3 rounded-full bg-[#1E6FFF]" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#747E93]">
            <span>0.5</span>
            <span>3</span>
          </div>
        </PropertyGroup>

        <PropertyGroup
          icon={<ChevronDown aria-hidden="true" className="size-4" />}
          title="크기"
          description="다운로드 높이 기준 크기입니다."
        >
          <div className="rounded-[8px] border border-[#D9DCE3] bg-white px-3 py-2 text-sm font-medium text-[#111620]">
            64px
          </div>
        </PropertyGroup>
      </div>

      <div className="mt-auto pt-6">
        <Button className="w-full" size="lg" type="button">
          다운로드 준비 중
        </Button>
      </div>
    </aside>
  );
}

type PreviewTileProps = {
  label: string;
  active?: boolean;
};

function PreviewTile({ label, active = false }: PreviewTileProps) {
  return (
    <div
      className={
        active
          ? "flex aspect-square items-center justify-center rounded-[12px] border border-[#1E6FFF] bg-[#EBF2FF] text-xs font-semibold text-[#124199]"
          : "flex aspect-square items-center justify-center rounded-[12px] border border-[#D9DCE3] bg-white text-xs font-medium text-[#747E93]"
      }
    >
      {label}
    </div>
  );
}

type PropertyGroupProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

function PropertyGroup({
  icon,
  title,
  description,
  children,
}: PropertyGroupProps) {
  return (
    <section>
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 text-[#1E6FFF]">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold leading-5 text-[#111620]">
            {title}
          </h3>
          <p className="text-xs leading-4 text-[#545D70]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function getUploadCopy(type: UploadType) {
  if (type === IconType.MAIN) {
    return {
      title: "메인 아이콘 업로드",
      policy: "메인 아이콘은 SVG 1개만 선택하고 anchor 좌표를 입력합니다.",
    };
  }

  if (type === IconType.MERGE_TEXT) {
    return {
      title: "텍스트 SVG 업로드",
      policy: "텍스트 SVG는 여러 개를 한 번에 선택할 수 있습니다.",
    };
  }

  return {
    title: "병합용 아이콘 업로드",
    policy: "병합용 아이콘은 여러 개를 한 번에 선택할 수 있습니다.",
  };
}

function readClientSvgSize(svg: string) {
  const viewBox = svg.match(/\sviewBox=["']([^"']+)["']/i)?.[1];

  if (viewBox) {
    const values = viewBox.trim().split(/[\s,]+/).map(Number);

    if (values.length === 4 && values.every(Number.isFinite)) {
      return { width: values[2], height: values[3] };
    }
  }

  const width = parseSvgLength(svg.match(/\swidth=["']([^"']+)["']/i)?.[1]);
  const height = parseSvgLength(svg.match(/\sheight=["']([^"']+)["']/i)?.[1]);

  if (width && height) {
    return { width, height };
  }

  return null;
}

function parseSvgLength(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)(?:px)?$/i);

  return match ? Number(match[1]) : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getContainedRect(
  containerRect: DOMRect,
  mediaSize: { width: number; height: number },
) {
  const containerRatio = containerRect.width / containerRect.height;
  const mediaRatio = mediaSize.width / mediaSize.height;

  if (mediaRatio > containerRatio) {
    const height = containerRect.width / mediaRatio;

    return {
      left: containerRect.left,
      top: containerRect.top + (containerRect.height - height) / 2,
      width: containerRect.width,
      height,
    };
  }

  const width = containerRect.height * mediaRatio;

  return {
    left: containerRect.left + (containerRect.width - width) / 2,
    top: containerRect.top,
    width,
    height: containerRect.height,
  };
}

function formatCoordinate(value: number) {
  return Number((Math.round(value * 2) / 2).toFixed(1)).toString();
}

function getTextCardWidth(icon: WorkspaceIcon) {
  const ratio = icon.width / icon.height;

  return clamp(Math.round(64 * ratio + 24), 104, 176);
}

function isClientSvgFile(file: File) {
  return file.name.toLowerCase().endsWith(".svg") && file.type === "image/svg+xml";
}

