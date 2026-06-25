"use client";

import {
  ChevronDown,
  Crosshair,
  Download,
  Palette,
  RotateCcw,
  Settings2,
  Trash2,
  Type,
  UploadCloud,
  MoreVertical,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { IconButtonTooltip } from "@/components/ui/icon-button-tooltip";
import { IconType } from "@/generated/prisma/enums";
import {
  mergeSvgsByAnchor,
  type MergedSvgResult,
} from "@/lib/svg/merge-svg";

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

const defaultIconProperties = {
  color: "#000000",
  strokeWidth: 1,
  size: 24,
  format: "svg" as DownloadFormat,
};

const strokeWidthOptions = [0.5, 1, 1.5, 2, 2.5, 3];
const downloadFormatOptions = [
  { label: "SVG", value: "svg" },
  { label: "PNG", value: "png" },
  { label: "JPG", value: "jpg" },
] satisfies Array<{ label: string; value: DownloadFormat }>;

type IconTypeValue = (typeof IconType)[keyof typeof IconType];
type UploadType = typeof IconType.MAIN | typeof IconType.MERGE_ICON | typeof IconType.MERGE_TEXT;
type DownloadFormat = "svg" | "png" | "jpg";
type MobileResourceTab = typeof IconType.MERGE_ICON | typeof IconType.MERGE_TEXT;

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
    role: "admin" | "user";
  };
  icons: WorkspaceIcon[];
};

type SelectedIconIds = Record<IconTypeValue, string[]>;
type ResourceIconType = typeof IconType.MERGE_ICON | typeof IconType.MERGE_TEXT;
type MainIconAnchor = {
  anchorX: number;
  anchorY: number;
};
type RepresentativeSelection = {
  mainIconId: string | null;
  resourceIconId: string | null;
  resourceType: ResourceIconType | null;
};

const emptySelectedIconIds: SelectedIconIds = {
  [IconType.MAIN]: [],
  [IconType.MERGE_ICON]: [],
  [IconType.MERGE_TEXT]: [],
};

const emptyRepresentativeSelection: RepresentativeSelection = {
  mainIconId: null,
  resourceIconId: null,
  resourceType: null,
};

export function IconWorkspace({ user, icons }: IconWorkspaceProps) {
  const router = useRouter();
  const canManageIcons = user.role === "admin";
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
  const [activeMobileResourceTab, setActiveMobileResourceTab] =
    useState<MobileResourceTab>(IconType.MERGE_ICON);
  const [selectedIconIds, setSelectedIconIds] = useState<SelectedIconIds>(
    emptySelectedIconIds,
  );
  const [representativeSelection, setRepresentativeSelection] =
    useState<RepresentativeSelection>(emptyRepresentativeSelection);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: IconTypeValue;
    title: string;
  } | null>(null);
  const [anchorEditingIcon, setAnchorEditingIcon] = useState<WorkspaceIcon | null>(null);
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
  const selectedMainIcon = useMemo(
    () => {
      const representativeMainIcon = representativeSelection.mainIconId
        ? mainIcons.find(
            (icon) =>
              icon.id === representativeSelection.mainIconId &&
              selectedIconIds[IconType.MAIN].includes(icon.id),
          )
        : null;

      return (
        representativeMainIcon ??
        findLastSelectedIcon(mainIcons, selectedIconIds[IconType.MAIN])
      );
    },
    [mainIcons, representativeSelection.mainIconId, selectedIconIds],
  );
  const selectedResourceIcon = useMemo(
    () => {
      const representativeResourceIcons =
        representativeSelection.resourceType === IconType.MERGE_TEXT
          ? mergeTexts
          : mergeIcons;
      const representativeResourceSelectedIds =
        representativeSelection.resourceType === IconType.MERGE_TEXT
          ? selectedIconIds[IconType.MERGE_TEXT]
          : selectedIconIds[IconType.MERGE_ICON];
      const representativeResourceIcon =
        representativeSelection.resourceType && representativeSelection.resourceIconId
          ? representativeResourceIcons.find(
              (icon) =>
                icon.id === representativeSelection.resourceIconId &&
                representativeResourceSelectedIds.includes(icon.id),
            )
          : null;

      return (
        representativeResourceIcon ??
        findLastSelectedIcon(mergeIcons, selectedIconIds[IconType.MERGE_ICON]) ??
        findLastSelectedIcon(mergeTexts, selectedIconIds[IconType.MERGE_TEXT])
      );
    },
    [
      mergeIcons,
      mergeTexts,
      representativeSelection.resourceIconId,
      representativeSelection.resourceType,
      selectedIconIds,
    ],
  );
  const selectedMainCount = selectedIconIds[IconType.MAIN].length;
  const selectedResourceCount =
    selectedIconIds[IconType.MERGE_ICON].length +
    selectedIconIds[IconType.MERGE_TEXT].length;
  const mergedPreview = useMemo(() => {
    if (!selectedMainIcon || !selectedResourceIcon) {
      return null;
    }

    return mergeSvgsByAnchor(selectedMainIcon, selectedResourceIcon);
  }, [selectedMainIcon, selectedResourceIcon]);
  const canOpenMobileProperties = Boolean(
    selectedMainIcon && selectedResourceIcon && mergedPreview,
  );
  const isMobilePropertiesDrawerOpen =
    isMobilePropertiesOpen && canOpenMobileProperties;
  const mobilePropertiesButtonLabel =
    selectedResourceIcon?.type === IconType.MERGE_TEXT
      ? "메인 + 텍스트 : 결과 조정하기"
      : "메인 + 아이콘 : 결과 조정하기";

  function toggleIconSelection(type: IconTypeValue, iconId: string) {
    const isSelected = selectedIconIds[type].includes(iconId);

    setRepresentativeSelection((currentSelection) => {
      if (!isSelected && type === IconType.MAIN) {
        return {
          ...currentSelection,
          mainIconId: iconId,
        };
      }

      if (!isSelected && isResourceIconType(type)) {
        return {
          ...currentSelection,
          resourceIconId: iconId,
          resourceType: type,
        };
      }

      if (isSelected && type === IconType.MAIN && currentSelection.mainIconId === iconId) {
        return {
          ...currentSelection,
          mainIconId: null,
        };
      }

      if (isSelected && currentSelection.resourceIconId === iconId) {
        return {
          ...currentSelection,
          resourceIconId: null,
          resourceType: null,
        };
      }

      return currentSelection;
    });

    setSelectedIconIds((currentSelection) => {
      const selectedIds = currentSelection[type];
      const nextSelection = selectedIds.includes(iconId)
        ? selectedIds.filter((id) => id !== iconId)
        : [...selectedIds, iconId];
      const oppositeResourceType = getOppositeResourceType(type);

      if (!canManageIcons) {
        return {
          ...currentSelection,
          ...(oppositeResourceType ? { [oppositeResourceType]: [] } : {}),
          [type]: selectedIds.includes(iconId) ? [] : [iconId],
        };
      }

      return {
        ...currentSelection,
        ...(oppositeResourceType && !selectedIds.includes(iconId)
          ? { [oppositeResourceType]: [] }
          : {}),
        [type]: nextSelection,
      };
    });
  }

  function selectAllIcons(type: IconTypeValue, targetIcons: WorkspaceIcon[]) {
    const representativeIcon = targetIcons[0];

    if (representativeIcon) {
      setRepresentativeSelection((currentSelection) => {
        if (type === IconType.MAIN) {
          return {
            ...currentSelection,
            mainIconId: representativeIcon.id,
          };
        }

        if (isResourceIconType(type)) {
          return {
            ...currentSelection,
            resourceIconId: representativeIcon.id,
            resourceType: type,
          };
        }

        return currentSelection;
      });
    }

    setSelectedIconIds((currentSelection) => {
      const oppositeResourceType = getOppositeResourceType(type);

      return {
        ...currentSelection,
        ...(oppositeResourceType ? { [oppositeResourceType]: [] } : {}),
        [type]: targetIcons.map((icon) => icon.id),
      };
    });
  }

  function clearIconSelection(type: IconTypeValue) {
    setRepresentativeSelection((currentSelection) => {
      if (type === IconType.MAIN) {
        return {
          ...currentSelection,
          mainIconId: null,
        };
      }

      if (isResourceIconType(type) && currentSelection.resourceType === type) {
        return {
          ...currentSelection,
          resourceIconId: null,
          resourceType: null,
        };
      }

      return currentSelection;
    });

    setSelectedIconIds((currentSelection) => ({
      ...currentSelection,
      [type]: [],
    }));
  }

  function requestDeleteSelected(type: IconTypeValue, title: string) {
    if (!canManageIcons) {
      return;
    }

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
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#D9DCE3] bg-white px-4 md:px-8">
        <div>
          <p className="text-xs font-medium tracking-[0.25px] text-[#1E6FFF]">
            ICON Merger
          </p>
          <h1 className="text-lg font-semibold leading-6 text-[#111620] md:text-xl md:leading-7">
            SVG 아이콘 작업 공간
          </h1>
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <div className="flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="font-medium text-[#111620]">
              {user.name ?? "허용된 사용자"}
            </span>
            <span className="text-[#545D70]">{user.email}</span>
            <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-xs font-semibold text-[#124199]">
              {canManageIcons ? "관리자" : "사용자"}
            </span>
          </div>
          <SignOutButton />
        </div>
        <Button
          aria-controls="mobile-menu"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
          className="border-[#D9DCE3] bg-white text-[#111620] hover:bg-[#F7F8FA] md:hidden"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Menu aria-hidden="true" className="size-4" />
          )}
        </Button>
      </header>

      {isMobileMenuOpen ? (
        <div
          className="fixed left-4 right-4 top-18 z-40 rounded-[16px] border border-[#D9DCE3] bg-white p-4 shadow-[0_12px_32px_rgba(17,22,32,0.16)] md:hidden"
          id="mobile-menu"
        >
          <div className="flex items-center justify-between gap-4 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#111620]">
                  {user.name ?? "허용된 사용자"}
                </p>
                <span className="shrink-0 rounded-full bg-[#EBF2FF] px-2 py-0.5 text-xs font-semibold text-[#124199]">
                  {canManageIcons ? "관리자" : "사용자"}
                </span>
              </div>
              <p className="mt-2 break-all text-sm text-[#545D70]">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      ) : null}

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-4 p-4 pb-28 md:grid-cols-[minmax(180px,0.8fr)_minmax(360px,1.2fr)] md:gap-5 md:p-5 lg:grid-cols-[minmax(196px,0.8fr)_minmax(440px,2fr)_minmax(300px,1fr)] lg:gap-6 lg:p-6">
        <IconPanel
          title="메인 아이콘"
          description="병합 기준점이 저장되는 원본 아이콘입니다."
          actionLabel="메인 추가"
          emptyTitle="메인 아이콘이 없습니다"
          emptyDescription={
            canManageIcons
              ? "SVG 업로드 후 이곳에 메인 아이콘이 표시됩니다."
              : "관리자가 공용 라이브러리에 추가하면 이곳에 표시됩니다."
          }
          icons={mainIcons}
          layout="list"
          selectedIds={selectedIconIds[IconType.MAIN]}
          canManageIcons={canManageIcons}
          isDeleting={deletingType === IconType.MAIN}
          onAdd={() => setUploadType(IconType.MAIN)}
          onClearSelection={() => clearIconSelection(IconType.MAIN)}
          onDeleteSelected={() => requestDeleteSelected(IconType.MAIN, "메인 아이콘")}
          onEditAnchor={canManageIcons ? setAnchorEditingIcon : undefined}
          onSelectAll={() => selectAllIcons(IconType.MAIN, mainIcons)}
          onToggleIcon={(iconId) => toggleIconSelection(IconType.MAIN, iconId)}
        />

        <section className="hidden min-w-0 flex-col gap-6 md:flex">
          <ResourceSection
            title="병합용 아이콘"
            description="메인 아이콘의 절단 영역에 붙일 아이콘 리소스입니다."
            actionLabel="아이콘 추가"
            emptyTitle="병합용 아이콘이 없습니다"
            emptyDescription={
              canManageIcons
                ? "업로드 후 여러 아이콘 중 하나를 선택할 수 있습니다."
                : "관리자가 공용 라이브러리에 추가하면 이곳에 표시됩니다."
            }
            icons={mergeIcons}
            selectedIds={selectedIconIds[IconType.MERGE_ICON]}
            canManageIcons={canManageIcons}
            isDeleting={deletingType === IconType.MERGE_ICON}
            onAdd={() => setUploadType(IconType.MERGE_ICON)}
            onClearSelection={() => clearIconSelection(IconType.MERGE_ICON)}
            onDeleteSelected={() => requestDeleteSelected(IconType.MERGE_ICON, "병합용 아이콘")}
            onSelectAll={() => selectAllIcons(IconType.MERGE_ICON, mergeIcons)}
            onToggleIcon={(iconId) => toggleIconSelection(IconType.MERGE_ICON, iconId)}
          />
          <ResourceSection
            title="병합용 텍스트"
            description="문자나 라벨 형태의 SVG 리소스입니다."
            actionLabel="텍스트 추가"
            emptyTitle="병합용 텍스트가 없습니다"
            emptyDescription={
              canManageIcons
                ? "병합용 텍스트를 업로드하면 별도 섹션으로 관리됩니다."
                : "관리자가 공용 라이브러리에 추가하면 이곳에 표시됩니다."
            }
            icons={mergeTexts}
            iconKind="text"
            selectedIds={selectedIconIds[IconType.MERGE_TEXT]}
            canManageIcons={canManageIcons}
            isDeleting={deletingType === IconType.MERGE_TEXT}
            onAdd={() => setUploadType(IconType.MERGE_TEXT)}
            onClearSelection={() => clearIconSelection(IconType.MERGE_TEXT)}
            onDeleteSelected={() => requestDeleteSelected(IconType.MERGE_TEXT, "병합용 텍스트")}
            onSelectAll={() => selectAllIcons(IconType.MERGE_TEXT, mergeTexts)}
            onToggleIcon={(iconId) => toggleIconSelection(IconType.MERGE_TEXT, iconId)}
          />
        </section>

        <MobileResourceTabs
          activeTab={activeMobileResourceTab}
          canManageIcons={canManageIcons}
          deletingType={deletingType}
          mergeIcons={mergeIcons}
          mergeTexts={mergeTexts}
          selectedIconIds={selectedIconIds}
          onAdd={(type) => setUploadType(type)}
          onClearSelection={clearIconSelection}
          onDeleteSelected={requestDeleteSelected}
          onSelectAll={selectAllIcons}
          onTabChange={setActiveMobileResourceTab}
          onToggleIcon={toggleIconSelection}
        />

        <div className="hidden md:col-span-2 md:block lg:col-span-1">
          <PropertiesPanel
            mainIcon={selectedMainIcon}
            mergedPreview={mergedPreview}
            resourceIcon={selectedResourceIcon}
            selectedMainCount={selectedMainCount}
            selectedResourceCount={selectedResourceCount}
          />
        </div>
      </div>

      {canOpenMobileProperties && !isMobilePropertiesDrawerOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
          <Button
            aria-label="선택한 조합의 결과 속성 열기"
            className="h-12 w-full rounded-[14px] shadow-[0_8px_24px_rgba(30,111,255,0.28)]"
            size="lg"
            type="button"
            onClick={() => setIsMobilePropertiesOpen(true)}
          >
            {mobilePropertiesButtonLabel}
          </Button>
        </div>
      ) : null}

      {isMobilePropertiesDrawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="속성 패널 닫기"
            className="absolute inset-0 cursor-default bg-[#111620]/40"
            type="button"
            onClick={() => setIsMobilePropertiesOpen(false)}
          />
          <div
            aria-labelledby="mobile-properties-drawer-title"
            aria-modal="true"
            className="mobile-properties-drawer absolute inset-y-0 right-0 flex w-[min(92vw,420px)] flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.16)]"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[#D9DCE3] px-4 py-3">
              <div>
                <p className="text-xs font-medium tracking-[0.25px] text-[#1E6FFF]">
                  결과 조정
                </p>
                <h2
                  className="text-base font-semibold text-[#111620]"
                  id="mobile-properties-drawer-title"
                >
                  아이콘 속성
                </h2>
              </div>
              <Button
                aria-label="속성 패널 닫기"
                className="border-[#D9DCE3] bg-white text-[#111620] hover:bg-[#F7F8FA]"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => setIsMobilePropertiesOpen(false)}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] p-4">
              <PropertiesPanel
                idPrefix="mobile-properties-panel"
                mainIcon={selectedMainIcon}
                mergedPreview={mergedPreview}
                resourceIcon={selectedResourceIcon}
                selectedMainCount={selectedMainCount}
                selectedResourceCount={selectedResourceCount}
              />
            </div>
          </div>
        </div>
      ) : null}

      {canManageIcons && uploadType ? (
        <UploadDialog
          type={uploadType}
          onClose={() => setUploadType(null)}
        />
      ) : null}
      {anchorEditingIcon ? (
        <AnchorEditDialog
          icon={anchorEditingIcon}
          onClose={() => setAnchorEditingIcon(null)}
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
  canManageIcons: boolean;
  isDeleting: boolean;
  onAdd: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onEditAnchor?: (icon: WorkspaceIcon) => void;
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
  canManageIcons,
  isDeleting,
  onAdd,
  onClearSelection,
  onDeleteSelected,
  onEditAnchor,
  onSelectAll,
  onToggleIcon,
  layout = "grid",
  iconKind = "icon",
}: IconPanelProps) {
  const sectionId = createDomId("icon-section", title);
  const descriptionId = `${sectionId}-description`;

  return (
    <section
      aria-describedby={descriptionId}
      aria-labelledby={sectionId}
      className="flex min-h-0 min-w-0 flex-col rounded-[16px] border border-[#ECEEF2] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <SectionHeader
        title={title}
        description={description}
        descriptionId={descriptionId}
        titleId={sectionId}
        actionLabel={actionLabel}
        selectedCount={selectedIds.length}
        totalCount={icons.length}
        canManageIcons={canManageIcons}
        isDeleting={isDeleting}
        onAdd={onAdd}
        onClearSelection={onClearSelection}
        onDeleteSelected={onDeleteSelected}
        onSelectAll={onSelectAll}
      />

      <div
        aria-label={icons.length > 0 ? `${title} 목록` : undefined}
        className={
          layout === "list"
            ? "mt-5 grid grid-cols-3 gap-2 overflow-y-auto md:grid-cols-2 md:gap-3"
            : iconKind === "text"
              ? "mt-5 flex flex-wrap items-start gap-4 overflow-y-auto"
              : "mt-5 grid grid-cols-[repeat(auto-fill,64px)] gap-3 overflow-y-auto"
        }
        role={icons.length > 0 ? "list" : undefined}
      >
        {icons.length > 0 ? (
          icons.map((icon) => (
            <IconCard
              key={icon.id}
              icon={icon}
              isSelected={selectedIds.includes(icon.id)}
              kind={iconKind}
              layout={layout}
              onEditAnchor={
                icon.type === IconType.MAIN && onEditAnchor
                  ? () => onEditAnchor(icon)
                  : undefined
              }
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

type MobileResourceTabsProps = {
  activeTab: MobileResourceTab;
  mergeIcons: WorkspaceIcon[];
  mergeTexts: WorkspaceIcon[];
  selectedIconIds: SelectedIconIds;
  canManageIcons: boolean;
  deletingType: IconTypeValue | null;
  onAdd: (type: UploadType) => void;
  onClearSelection: (type: IconTypeValue) => void;
  onDeleteSelected: (type: IconTypeValue, title: string) => void;
  onSelectAll: (type: IconTypeValue, targetIcons: WorkspaceIcon[]) => void;
  onTabChange: (tab: MobileResourceTab) => void;
  onToggleIcon: (type: IconTypeValue, iconId: string) => void;
};

function MobileResourceTabs({
  activeTab,
  mergeIcons,
  mergeTexts,
  selectedIconIds,
  canManageIcons,
  deletingType,
  onAdd,
  onClearSelection,
  onDeleteSelected,
  onSelectAll,
  onTabChange,
  onToggleIcon,
}: MobileResourceTabsProps) {
  const activeTabConfig =
    activeTab === IconType.MERGE_TEXT
      ? {
          actionLabel: "텍스트 추가",
          description: "문자나 라벨 형태의 SVG 리소스입니다.",
          emptyDescription: canManageIcons
            ? "병합용 텍스트를 업로드하면 별도 섹션으로 관리됩니다."
            : "관리자가 공용 라이브러리에 추가하면 이곳에 표시됩니다.",
          emptyTitle: "병합용 텍스트가 없습니다",
          iconKind: "text" as const,
          icons: mergeTexts,
          title: "병합용 텍스트",
        }
      : {
          actionLabel: "아이콘 추가",
          description: "메인 아이콘의 절단 영역에 붙일 아이콘 리소스입니다.",
          emptyDescription: canManageIcons
            ? "업로드 후 여러 아이콘 중 하나를 선택할 수 있습니다."
            : "관리자가 공용 라이브러리에 추가하면 이곳에 표시됩니다.",
          emptyTitle: "병합용 아이콘이 없습니다",
          iconKind: "icon" as const,
          icons: mergeIcons,
          title: "병합용 아이콘",
        };

  return (
    <section
      aria-label="병합 리소스 선택"
      className="min-w-0 md:hidden"
    >
      <div
        className="mb-3 grid grid-cols-2 gap-2 rounded-[14px] border border-[#D9DCE3] bg-white p-1"
        role="tablist"
        aria-label="병합 리소스 종류"
      >
        <button
          aria-selected={activeTab === IconType.MERGE_ICON}
          className={
            activeTab === IconType.MERGE_ICON
              ? "h-10 rounded-[10px] bg-[#EBF2FF] text-sm font-semibold text-[#124199]"
              : "h-10 rounded-[10px] text-sm font-medium text-[#545D70]"
          }
          role="tab"
          type="button"
          onClick={() => onTabChange(IconType.MERGE_ICON)}
        >
          아이콘
        </button>
        <button
          aria-selected={activeTab === IconType.MERGE_TEXT}
          className={
            activeTab === IconType.MERGE_TEXT
              ? "h-10 rounded-[10px] bg-[#EBF2FF] text-sm font-semibold text-[#124199]"
              : "h-10 rounded-[10px] text-sm font-medium text-[#545D70]"
          }
          role="tab"
          type="button"
          onClick={() => onTabChange(IconType.MERGE_TEXT)}
        >
          텍스트
        </button>
      </div>

      <div role="tabpanel">
        <ResourceSection
          actionLabel={activeTabConfig.actionLabel}
          canManageIcons={canManageIcons}
          description={activeTabConfig.description}
          emptyDescription={activeTabConfig.emptyDescription}
          emptyTitle={activeTabConfig.emptyTitle}
          iconKind={activeTabConfig.iconKind}
          icons={activeTabConfig.icons}
          isDeleting={deletingType === activeTab}
          selectedIds={selectedIconIds[activeTab]}
          title={activeTabConfig.title}
          onAdd={() => onAdd(activeTab)}
          onClearSelection={() => onClearSelection(activeTab)}
          onDeleteSelected={() => onDeleteSelected(activeTab, activeTabConfig.title)}
          onSelectAll={() => onSelectAll(activeTab, activeTabConfig.icons)}
          onToggleIcon={(iconId) => onToggleIcon(activeTab, iconId)}
        />
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
  titleId: string;
  descriptionId: string;
  actionLabel: string;
  selectedCount: number;
  totalCount: number;
  canManageIcons: boolean;
  isDeleting: boolean;
  onAdd: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
};

function SectionHeader({
  title,
  description,
  titleId,
  descriptionId,
  actionLabel,
  selectedCount,
  totalCount,
  canManageIcons,
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
          <h2
            className="text-xl font-semibold leading-7 text-[#111620]"
            id={titleId}
          >
            {title}
          </h2>
          <p
            className="mt-1 text-sm leading-5 text-[#545D70]"
            id={descriptionId}
          >
            {description}
          </p>
        </div>
        {canManageIcons ? (
          <Button size="sm" type="button" onClick={onAdd}>
            {actionLabel}
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3">
        {canManageIcons && hasSelection ? (
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className="rounded-full bg-[#EBF2FF] px-3 py-1 text-xs font-semibold tracking-[0.25px] text-[#124199]"
            >
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
            {canManageIcons
              ? "항목 선택 후 선택 해제와 삭제 액션이 표시됩니다."
              : "공용 라이브러리에서 사용할 아이콘을 하나 선택하세요."}
          </p>
        )}

        {canManageIcons ? (
          <div ref={menuRef} className="relative">
            <Button
              aria-label={`${title} 더보기`}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              className="border-[#D9DCE3] bg-white text-[#111620] hover:bg-[#F7F8FA]"
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <MoreVertical aria-hidden="true" className="size-4" />
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
        ) : null}
      </div>
    </div>
  );
}

type IconCardProps = {
  icon: WorkspaceIcon;
  isSelected: boolean;
  layout: "list" | "grid";
  kind: "icon" | "text";
  onEditAnchor?: () => void;
  onToggle: () => void;
};

function IconCard({ icon, isSelected, layout, kind, onEditAnchor, onToggle }: IconCardProps) {
  const isList = layout === "list";
  const isText = kind === "text";
  const cardStyle =
    isText
      ? {
          "--text-card-width": `${getTextCardWidth(icon)}px`,
          "--text-card-mobile-width": `${getMobileTextCardWidth(icon)}px`,
        } as TextCardStyle
      : undefined;
  const cardClassName = isText
    ? isSelected
      ? "group relative flex h-14 w-[var(--text-card-mobile-width)] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 border-[#1E6FFF] bg-[#EBF2FF] p-2 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20 md:h-[88px] md:w-[var(--text-card-width)] md:rounded-[12px] md:p-3"
      : "group relative flex h-14 w-[var(--text-card-mobile-width)] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#D9DCE3] bg-white p-2 transition hover:border-[#99BFFF] hover:bg-[#EBF2FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20 md:h-[88px] md:w-[var(--text-card-width)] md:rounded-[12px] md:p-3"
    : isSelected
      ? "group relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-[#1E6FFF] bg-[#EBF2FF] p-2 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20 md:rounded-[12px] md:p-3"
      : "group relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-[10px] border border-[#D9DCE3] bg-white p-2 transition hover:border-[#99BFFF] hover:bg-[#EBF2FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20 md:rounded-[12px] md:p-3";

  return (
    <IconTooltip content={icon.name} fullWidth={!isText}>
      <span
        className={isText ? "group relative inline-flex shrink-0" : "group relative inline-flex w-full"}
      >
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
        {onEditAnchor ? (
          <button
            aria-label={`${icon.name} anchor 수정`}
            className="absolute left-1.5 top-1.5 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-[#D9DCE3] bg-white/95 text-[#545D70] opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition hover:border-[#1E6FFF] hover:text-[#1E6FFF] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#1E6FFF]/20 group-hover:opacity-100"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditAnchor();
            }}
          >
            <Crosshair aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </span>
    </IconTooltip>
  );
}

type IconPreviewProps = {
  icon: WorkspaceIcon;
  kind: "icon" | "text";
  compact?: boolean;
};

type TextCardStyle = CSSProperties & {
  "--text-card-width": string;
  "--text-card-mobile-width": string;
};

function IconPreview({ icon, kind, compact = false }: IconPreviewProps) {
  const iconSizeClass =
    kind === "text"
      ? "[&_svg]:h-6 [&_svg]:w-auto [&_svg]:max-w-full md:[&_svg]:h-10"
      : "[&_svg]:h-10 [&_svg]:w-10";
  const lineIconClass =
    kind === "icon"
      ? "svg-line-preview text-[#111620]"
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

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    function hideTooltip() {
      setIsVisible(false);
    }

    window.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("resize", hideTooltip);

    return () => {
      window.removeEventListener("scroll", hideTooltip, true);
      window.removeEventListener("resize", hideTooltip);
    };
  }, [isVisible]);

  function showTooltip() {
    const trigger = triggerRef.current;

    if (!trigger || !canShowHoverTooltip()) {
      setIsVisible(false);
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
      role="listitem"
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

function canShowHoverTooltip() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
        aria-describedby="delete-confirm-description"
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
            <p
              className="mt-2 text-sm leading-5 text-[#545D70]"
              id="delete-confirm-description"
            >
              선택한 {selectedCount}개 항목을 삭제합니다. 삭제한 SVG 리소스는 되돌릴 수 없습니다.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p
            className="mt-4 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
            role="alert"
          >
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

type AnchorEditDialogProps = {
  icon: WorkspaceIcon;
  onClose: () => void;
};

function AnchorEditDialog({
  icon,
  onClose,
}: AnchorEditDialogProps) {
  const router = useRouter();
  const anchorStageRef = useRef<HTMLDivElement>(null);
  const anchorImageRef = useRef<HTMLDivElement>(null);
  const [anchorX, setAnchorX] = useState(formatCoordinate(icon.anchorX ?? 0));
  const [anchorY, setAnchorY] = useState(formatCoordinate(icon.anchorY ?? 0));
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewSize = {
    width: icon.width,
    height: icon.height,
  };
  const anchorPosition = useMemo(() => {
    const x = Number(anchorX);
    const y = Number(anchorY);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return {
      left: `${Math.min(Math.max((x / previewSize.width) * 100, 0), 100)}%`,
      top: `${Math.min(Math.max((y / previewSize.height) * 100, 0), 100)}%`,
    };
  }, [anchorX, anchorY, previewSize.height, previewSize.width]);

  function updateAnchorFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (!anchorStageRef.current) {
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
    setErrorMessage(null);
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

  function resetToOriginalAnchor() {
    setAnchorX(formatCoordinate(icon.anchorX ?? 0));
    setAnchorY(formatCoordinate(icon.anchorY ?? 0));
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const nextAnchorX = Number(anchorX);
    const nextAnchorY = Number(anchorY);

    if (!Number.isFinite(nextAnchorX) || !Number.isFinite(nextAnchorY)) {
      setErrorMessage("anchorX와 anchorY 좌표를 숫자로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/icons/${icon.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anchorX: nextAnchorX,
          anchorY: nextAnchorY,
        } satisfies MainIconAnchor),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? "anchor 좌표 저장에 실패했습니다.");
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
        aria-describedby="anchor-edit-description"
        aria-labelledby="anchor-edit-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        role="dialog"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold leading-7 text-[#111620]"
              id="anchor-edit-title"
            >
              메인 아이콘 anchor 수정
            </h2>
            <p
              className="mt-1 text-sm leading-5 text-[#545D70]"
              id="anchor-edit-description"
            >
              관리자 전용 설정입니다. 저장하면 공용 라이브러리의 기본 병합 좌표가 변경됩니다.
            </p>
          </div>
          <Button disabled={isSubmitting} size="sm" type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="mt-4 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-3">
          <p className="text-xs font-semibold tracking-[0.25px] text-[#545D70]">
            수정 대상
          </p>
          <p className="mt-1 truncate text-sm font-medium text-[#111620]">
            {icon.name}
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
          <div
            ref={anchorStageRef}
            className="relative flex min-h-56 touch-none select-none items-center justify-center overflow-hidden rounded-[12px] border border-[#D9DCE3] bg-[#F7F8FA] p-4"
            role="presentation"
            style={{
              cursor: isDraggingAnchor ? "grabbing" : "crosshair",
            }}
            onPointerCancel={handleAnchorPointerUp}
            onPointerDown={handleAnchorPointerDown}
            onPointerMove={handleAnchorPointerMove}
            onPointerUp={handleAnchorPointerUp}
          >
            <div
              ref={anchorImageRef}
              className="pointer-events-none relative h-48 max-w-full"
              style={{
                aspectRatio: `${previewSize.width} / ${previewSize.height}`,
              }}
            >
              <div
                aria-hidden="true"
                className="svg-line-preview absolute inset-0 flex items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: icon.svgContent }}
              />
              {anchorPosition ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1E6FFF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] before:absolute before:left-1/2 before:top-[-10px] before:h-8 before:w-px before:-translate-x-1/2 before:bg-[#1E6FFF] after:absolute after:left-[-10px] after:top-1/2 after:h-px after:w-8 after:-translate-y-1/2 after:bg-[#1E6FFF]"
                  style={anchorPosition}
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-[#545D70]">anchorX</span>
              <input
                className="mt-1 h-11 w-full rounded-[8px] border border-[#D9DCE3] px-3 text-sm outline-none focus:border-[#1E6FFF]"
                min="0"
                step="0.5"
                type="number"
                value={anchorX}
                onChange={(event) => setAnchorX(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#545D70]">anchorY</span>
              <input
                className="mt-1 h-11 w-full rounded-[8px] border border-[#D9DCE3] px-3 text-sm outline-none focus:border-[#1E6FFF]"
                min="0"
                step="0.5"
                type="number"
                value={anchorY}
                onChange={(event) => setAnchorY(event.target.value)}
              />
            </label>
            <p className="text-xs leading-4 text-[#747E93]">
              아이콘 위를 클릭하거나 드래그해 병합 시작 좌표를 조정합니다.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p
            className="mt-4 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-between gap-2">
          <Button disabled={isSubmitting} type="button" variant="ghost" onClick={resetToOriginalAnchor}>
            현재 저장값
          </Button>
          <div className="flex gap-2">
            <Button disabled={isSubmitting} type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </form>
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
  const dialogId = createDomId("upload-dialog", copy.title);
  const descriptionId = `${dialogId}-description`;
  const policyId = `${dialogId}-policy`;
  const selectedFilesId = `${dialogId}-selected-files`;

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

  function handleDropzoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    fileInputRef.current?.click();
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
        aria-describedby={descriptionId}
        aria-labelledby={dialogId}
        aria-modal="true"
        className="w-full max-w-xl rounded-[16px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        role="dialog"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold leading-7 text-[#111620]"
              id={dialogId}
            >
              {copy.title}
            </h2>
            <p
              className="mt-1 text-sm leading-5 text-[#545D70]"
              id={descriptionId}
            >
              SVG 파일만 업로드할 수 있으며 최대 256KB까지 허용됩니다.
            </p>
          </div>
          <Button size="sm" type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div
          aria-describedby={files.length > 0 ? `${policyId} ${selectedFilesId}` : policyId}
          aria-label={`${copy.title} 파일 선택 영역`}
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
          onKeyDown={handleDropzoneKeyDown}
          role="button"
          tabIndex={0}
        >
          <UploadCloud aria-hidden="true" className="size-8 text-[#1E6FFF]" />
          <p className="mt-3 text-sm font-semibold text-[#111620]">
            파일을 드래그하거나 클릭하여 선택
          </p>
          <p
            className="mt-1 text-xs text-[#545D70]"
            id={policyId}
          >
            {copy.policy}
          </p>
          <input
            ref={fileInputRef}
            accept=".svg,image/svg+xml"
            aria-label={`${copy.title} 파일 선택`}
            className="hidden"
            multiple={!isMain}
            onChange={handleInputChange}
            type="file"
          />
        </div>

        {files.length > 0 ? (
          <div
            aria-live="polite"
            className="mt-4 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-3"
            id={selectedFilesId}
          >
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.25px] text-[#545D70]">
                선택된 파일
              </p>
              <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-xs font-semibold text-[#124199]">
                {files.length}개
              </span>
            </div>
            <p className="mt-2 overflow-x-auto whitespace-nowrap text-sm leading-5 text-[#111620]">
              {files.map((file) => file.name).join(", ")}
            </p>
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
          <p
            className="mt-4 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
            role="alert"
          >
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

type PropertiesPanelProps = {
  mainIcon: WorkspaceIcon | null;
  resourceIcon: WorkspaceIcon | null;
  mergedPreview: MergedSvgResult | null;
  selectedMainCount: number;
  selectedResourceCount: number;
  idPrefix?: string;
};

function PropertiesPanel({
  mainIcon,
  resourceIcon,
  mergedPreview,
  selectedMainCount,
  selectedResourceCount,
  idPrefix = "properties-panel",
}: PropertiesPanelProps) {
  const [selectedColor, setSelectedColor] = useState(defaultIconProperties.color);
  const [strokeWidth, setStrokeWidth] = useState(defaultIconProperties.strokeWidth);
  const [outputSize, setOutputSize] = useState(defaultIconProperties.size);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>(
    defaultIconProperties.format,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isMissingSelection = !mainIcon || !resourceIcon;
  const isMissingAnchor = Boolean(mainIcon && resourceIcon) && !mergedPreview;
  const hasMultiplePreviewCandidates =
    selectedMainCount > 1 || selectedResourceCount > 1;
  const resourceKind = resourceIcon?.type === IconType.MERGE_TEXT ? "text" : "icon";
  const resultPreviewDisplaySize = clamp(outputSize * 1.5, 32, 64);
  const previewMergedSvg = useMemo(() => {
    if (!mergedPreview) {
      return null;
    }

    return applySvgProperties(mergedPreview, {
      color: selectedColor,
      outputHeight: resultPreviewDisplaySize,
      resourceKind,
      strokeWidth,
    });
  }, [mergedPreview, resultPreviewDisplaySize, resourceKind, selectedColor, strokeWidth]);
  const resultPreviewDisplayWidth =
    resourceKind === "text" && previewMergedSvg
      ? clamp(previewMergedSvg.width, resultPreviewDisplaySize, 144)
      : resultPreviewDisplaySize;
  const downloadMergedSvg = useMemo(() => {
    if (!mergedPreview) {
      return null;
    }

    return applySvgProperties(mergedPreview, {
      color: selectedColor,
      outputHeight: outputSize,
      resourceKind,
      strokeWidth,
    });
  }, [mergedPreview, outputSize, resourceKind, selectedColor, strokeWidth]);
  const canDownload = Boolean(downloadMergedSvg && mainIcon && resourceIcon);

  function resetProperties() {
    setSelectedColor(defaultIconProperties.color);
    setStrokeWidth(defaultIconProperties.strokeWidth);
    setOutputSize(defaultIconProperties.size);
    setDownloadFormat(defaultIconProperties.format);
    setDownloadError(null);
  }

  async function handleDownload() {
    if (!downloadMergedSvg || !mainIcon || !resourceIcon) {
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const filename = createMergedFilename({
        format: downloadFormat,
        mainName: mainIcon.name,
        resourceName: resourceIcon.name,
        size: outputSize,
      });

      if (downloadFormat === "svg") {
        downloadBlob(
          new Blob([downloadMergedSvg.svgContent], { type: "image/svg+xml;charset=utf-8" }),
          filename,
        );
        return;
      }

      const blob = await renderSvgToRasterBlob({
        format: downloadFormat,
        height: downloadMergedSvg.height,
        svgContent: downloadMergedSvg.svgContent,
        width: downloadMergedSvg.width,
      });

      downloadBlob(blob, filename);
    } catch {
      setDownloadError("다운로드 파일을 만드는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <aside
      aria-describedby={`${idPrefix}-description`}
      aria-labelledby={`${idPrefix}-title`}
      className="flex min-h-0 flex-col rounded-[16px] border border-[#ECEEF2] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-xl font-semibold leading-7 text-[#111620]"
            id={`${idPrefix}-title`}
          >
            아이콘 속성
          </h2>
          <p
            className="mt-1 text-sm leading-5 text-[#545D70]"
            id={`${idPrefix}-description`}
          >
            색상, 두께, 크기를 조정할 수 있습니다.
          </p>
        </div>
        <IconButtonTooltip label="초기화">
          <Button
            aria-label="초기화"
            className="border-[#D9DCE3] bg-white text-[#111620] hover:bg-[#F7F8FA]"
            size="icon"
            type="button"
            variant="ghost"
            onClick={resetProperties}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
          </Button>
        </IconButtonTooltip>
      </div>

      <div className="mt-6 rounded-[12px] border border-[#ECEEF2] bg-[#F7F8FA] p-4">
        <div className="mb-3 rounded-[10px] border border-[#D9DCE3] bg-white px-3 py-2">
          <p className="text-xs font-semibold tracking-[0.25px] text-[#545D70]">
            대표 미리보기
          </p>
          <p className="mt-1 truncate text-sm font-medium text-[#111620]">
            {mainIcon && resourceIcon
              ? `${mainIcon.name} + ${resourceIcon.name}`
              : "선택된 대표 조합 없음"}
          </p>
          {hasMultiplePreviewCandidates ? (
            <p className="mt-1 text-xs leading-4 text-[#747E93]">
              마지막으로 선택한 항목을 대표로 표시합니다.
            </p>
          ) : null}
        </div>
        <div
          className={
            resourceKind === "text"
              ? "grid grid-cols-[minmax(52px,0.8fr)_auto_minmax(72px,1fr)_auto_minmax(112px,1.5fr)] items-center gap-2"
              : "grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3"
          }
        >
          <PreviewTile
            fixedHeight={resourceKind === "text"}
            icon={mainIcon}
            kind="icon"
            label="메인"
          />
          <span className="text-sm font-semibold text-[#747E93]">+</span>
          <PreviewTile
            fixedHeight={resourceKind === "text"}
            icon={resourceIcon}
            kind={resourceIcon?.type === IconType.MERGE_TEXT ? "text" : "icon"}
            label="리소스"
          />
          <span className="text-sm font-semibold text-[#747E93]">=</span>
          <PreviewTile
            active
            activeSurface={selectedColor === "#FFFFFF" ? "dark" : "light"}
            displaySizePx={resultPreviewDisplaySize}
            displayWidthPx={resultPreviewDisplayWidth}
            fixedHeight={resourceKind === "text"}
            icon={previewMergedSvg}
            kind={resourceIcon?.type === IconType.MERGE_TEXT ? "merged-text" : "merged-icon"}
            label="결과"
          />
        </div>
        {isMissingSelection ? (
          <p className="mt-4 text-center text-xs leading-4 text-[#747E93]">
            메인 아이콘 1개와 병합용 아이콘 또는 병합용 텍스트 1개를 선택하면 병합 결과가 표시됩니다.
          </p>
        ) : isMissingAnchor ? (
          <p className="mt-4 text-center text-xs leading-4 text-[#B91C1C]">
            선택한 메인 아이콘에 anchor 좌표가 없어 병합 미리보기를 만들 수 없습니다.
          </p>
        ) : downloadMergedSvg ? (
          <p className="mt-4 text-center text-xs leading-4 text-[#545D70]">
            다운로드 크기 {formatDimension(downloadMergedSvg.width)} x{" "}
            {formatDimension(downloadMergedSvg.height)}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <PropertyGroup
          icon={<Palette aria-hidden="true" className="size-4" />}
          title="색상"
          description="문서 기준 10개 색상을 제공합니다."
        >
          <div className="grid grid-cols-5 gap-2" role="group" aria-label="아이콘 색상">
            {iconColorOptions.map((color) => (
              <button
                key={color.value}
                aria-label={`${color.label} ${color.value}`}
                aria-pressed={selectedColor === color.value}
                className={
                  selectedColor === color.value
                    ? "size-8 cursor-pointer rounded-[8px] border-2 border-[#1E6FFF] ring-2 ring-[#1E6FFF]/20"
                    : "size-8 cursor-pointer rounded-[8px] border border-[#D9DCE3] hover:border-[#99BFFF]"
                }
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    color.value === "#FFFFFF" && selectedColor !== color.value
                      ? "#E5E7EB"
                      : undefined,
                }}
                type="button"
                onClick={() => setSelectedColor(color.value)}
              >
                <span className="sr-only">
                  {selectedColor === color.value ? "선택됨" : "선택 안 됨"}
                </span>
              </button>
            ))}
          </div>
        </PropertyGroup>

        <PropertyGroup
          icon={<Settings2 aria-hidden="true" className="size-4" />}
          title="선 두께"
          description={`${strokeWidth}px, 0.5px 단위로 조정합니다.`}
        >
          <input
            aria-label="선 두께"
            aria-valuetext={`${strokeWidth}px`}
            className="h-2 w-full cursor-pointer accent-[#1E6FFF]"
            max="3"
            min="0.5"
            step="0.5"
            type="range"
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
          />
          <div className="mt-2 flex justify-between text-xs text-[#747E93]">
            {strokeWidthOptions.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </PropertyGroup>

        <PropertyGroup
          icon={<ChevronDown aria-hidden="true" className="size-4" />}
          title="크기"
          description={`다운로드 높이 기준 ${outputSize}px입니다.`}
        >
          <input
            aria-label="다운로드 크기"
            aria-valuetext={`${outputSize}px`}
            className="h-2 w-full cursor-pointer accent-[#1E6FFF]"
            max="256"
            min="16"
            step="4"
            type="range"
            value={outputSize}
            onChange={(event) => setOutputSize(Number(event.target.value))}
          />
          <div className="mt-2 flex justify-between text-xs text-[#747E93]">
            <span>16px</span>
            <span>{outputSize}px</span>
            <span>256px</span>
          </div>
          <p className="mt-2 text-xs leading-4 text-[#747E93]">
            목록에서 보이는 아이콘의 크기는 최대 56px입니다.
          </p>
        </PropertyGroup>

        <PropertyGroup
          icon={<Download aria-hidden="true" className="size-4" />}
          title="다운로드 포맷"
          description="SVG, PNG, JPG 중 하나를 선택합니다."
        >
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="다운로드 포맷">
            {downloadFormatOptions.map((format) => (
              <button
                key={format.value}
                aria-pressed={downloadFormat === format.value}
                className={
                  downloadFormat === format.value
                    ? "h-10 cursor-pointer rounded-[8px] border border-[#1E6FFF] bg-[#EBF2FF] text-sm font-semibold text-[#124199]"
                    : "h-10 cursor-pointer rounded-[8px] border border-[#D9DCE3] bg-white text-sm font-medium text-[#545D70] hover:border-[#99BFFF]"
                }
                type="button"
                onClick={() => {
                  setDownloadFormat(format.value);
                  setDownloadError(null);
                }}
              >
                {format.label}
              </button>
            ))}
          </div>
        </PropertyGroup>
      </div>

      <div className="mt-auto pt-6">
        {downloadError ? (
          <p
            className="mb-3 rounded-[12px] border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
            role="alert"
          >
            {downloadError}
          </p>
        ) : null}
        <Button
          className="w-full"
          disabled={!canDownload || isDownloading}
          size="lg"
          type="button"
          onClick={handleDownload}
        >
          {isDownloading ? "다운로드 준비 중..." : "다운로드"}
        </Button>
      </div>
    </aside>
  );
}

type PreviewTileProps = {
  label: string;
  icon?: (Pick<WorkspaceIcon, "svgContent"> | MergedSvgResult) | null;
  kind?: "icon" | "text" | "merged-icon" | "merged-text";
  active?: boolean;
  activeSurface?: "light" | "dark";
  displaySizePx?: number;
  displayWidthPx?: number;
  fixedHeight?: boolean;
};

function PreviewTile({
  label,
  icon = null,
  kind = "icon",
  active = false,
  activeSurface = "light",
  displaySizePx,
  displayWidthPx,
  fixedHeight = false,
}: PreviewTileProps) {
  const previewClassName = getPreviewSvgClassName(kind, Boolean(displaySizePx));
  const isWidePreview = Boolean(
    displaySizePx && displayWidthPx && displayWidthPx !== displaySizePx,
  );
  const tileShapeClassName =
    fixedHeight || isWidePreview
      ? "h-28"
      : "aspect-square";
  const activeClassName =
    activeSurface === "dark"
      ? `flex ${tileShapeClassName} min-w-0 items-center justify-center rounded-[12px] border border-[#1E6FFF] bg-[#111620] p-2 text-xs font-semibold text-white`
      : `flex ${tileShapeClassName} min-w-0 items-center justify-center rounded-[12px] border border-[#1E6FFF] bg-white p-2 text-xs font-semibold text-[#124199]`;

  return (
    <div
      className={
        active
          ? activeClassName
          : `flex ${tileShapeClassName} min-w-0 items-center justify-center rounded-[12px] border border-[#D9DCE3] bg-white p-2 text-xs font-medium text-[#747E93]`
      }
    >
      {icon?.svgContent ? (
        <div
          aria-label={label}
          className={previewClassName}
          dangerouslySetInnerHTML={{ __html: icon.svgContent }}
          role="img"
          style={
            displaySizePx
              ? {
                  height: `${displaySizePx}px`,
                  width: `${displayWidthPx ?? displaySizePx}px`,
                }
              : undefined
          }
        />
      ) : (
        label
      )}
    </div>
  );
}

function getPreviewSvgClassName(
  kind: NonNullable<PreviewTileProps["kind"]>,
  hasDisplaySize = false,
) {
  const baseClassName = "flex size-full items-center justify-center text-[#111620]";
  const customSizeClass = hasDisplaySize
    ? "[&_svg]:h-full [&_svg]:w-full"
    : "[&_svg]:h-8 [&_svg]:w-8";

  if (kind === "text") {
    return `${baseClassName} [&_svg]:h-8 [&_svg]:w-auto [&_svg]:max-w-full`;
  }

  if (kind === "merged-text") {
    return `${baseClassName} ${customSizeClass}`;
  }

  if (kind === "merged-icon") {
    return `${baseClassName} ${customSizeClass}`;
  }

  return `${baseClassName} svg-line-preview [&_svg]:h-8 [&_svg]:w-8`;
}

function applySvgProperties(
  mergedSvg: MergedSvgResult,
  options: {
    color: string;
    outputHeight: number;
    resourceKind: "icon" | "text";
    strokeWidth: number;
  },
) {
  const outputWidth = scaleWidthFromHeight(
    mergedSvg.width,
    mergedSvg.height,
    options.outputHeight,
  );
  const openingTag = mergedSvg.svgContent.match(/^<svg\b[^>]*>/i)?.[0];

  if (!openingTag) {
    return {
      ...mergedSvg,
      height: options.outputHeight,
      width: outputWidth,
    };
  }

  const propertyStyle = createSvgPropertyStyle(options);
  const scaledStrokeWidth = scaleStrokeWidth({
    outputHeight: options.outputHeight,
    sourceHeight: mergedSvg.height,
    strokeWidth: options.strokeWidth,
  });
  const withoutExistingPropertyStyle = mergedSvg.svgContent.replace(
    /<style data-icon-merger-properties="true">[\s\S]*?<\/style>/i,
    "",
  );
  const withSizedRoot = setSvgRootAttributes(withoutExistingPropertyStyle, {
    height: formatDimension(outputSizeToNumber(options.outputHeight)),
    width: formatDimension(outputSizeToNumber(outputWidth)),
  });
  const svgContent = withSizedRoot.replace(
    /^<svg\b[^>]*>/i,
    (tag) => `${tag}${propertyStyle(scaledStrokeWidth)}`,
  );

  return {
    ...mergedSvg,
    height: options.outputHeight,
    svgContent,
    width: outputWidth,
  } satisfies MergedSvgResult;
}

function createSvgPropertyStyle(options: {
  color: string;
  resourceKind: "icon" | "text";
}) {
  const lineLayerRules = [
    'svg [data-layer="main"] *',
    options.resourceKind === "icon" ? 'svg [data-layer="merge"] *' : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (scaledStrokeWidth: number) => {
    const strokeRule = `stroke-width: ${formatDimension(scaledStrokeWidth)} !important;`;
    const textLayerRules =
      options.resourceKind === "text"
        ? [
            `svg [data-layer="merge"] * { color: ${options.color} !important; fill: ${options.color} !important; }`,
            `svg [data-layer="merge"] [stroke]:not([stroke="none"]) { stroke: ${options.color} !important; }`,
          ].join("")
        : "";

    return [
      '<style data-icon-merger-properties="true">',
      `${lineLayerRules} { fill: none !important; stroke: ${options.color} !important; ${strokeRule} }`,
      textLayerRules,
      "</style>",
    ].join("");
  };
}

function setSvgRootAttributes(svgContent: string, attributes: Record<string, string>) {
  return svgContent.replace(/^<svg\b[^>]*>/i, (tag) => {
    let nextTag = tag;

    Object.entries(attributes).forEach(([name, value]) => {
      const attributePattern = new RegExp(`\\s${name}=["'][^"']*["']`, "i");

      nextTag = attributePattern.test(nextTag)
        ? nextTag.replace(attributePattern, ` ${name}="${value}"`)
        : nextTag.replace(/>$/, ` ${name}="${value}">`);
    });

    return nextTag;
  });
}

function scaleWidthFromHeight(width: number, height: number, outputHeight: number) {
  if (height <= 0) {
    return outputHeight;
  }

  return Number(((width / height) * outputHeight).toFixed(3));
}

function scaleStrokeWidth({
  outputHeight,
  sourceHeight,
  strokeWidth,
}: {
  outputHeight: number;
  sourceHeight: number;
  strokeWidth: number;
}) {
  if (outputHeight <= 0 || sourceHeight <= 0) {
    return strokeWidth;
  }

  return (strokeWidth * sourceHeight) / outputHeight;
}

function outputSizeToNumber(value: number) {
  return Number(value.toFixed(3));
}

function createMergedFilename({
  format,
  mainName,
  resourceName,
  size,
}: {
  format: DownloadFormat;
  mainName: string;
  resourceName: string;
  size: number;
}) {
  return `icon-merged-${slugifyFilenamePart(mainName)}-${slugifyFilenamePart(resourceName)}-${size}px.${format}`;
}

function slugifyFilenamePart(value: string) {
  const slug = value
    .replace(/\.[a-z0-9]+$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "icon";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function renderSvgToRasterBlob({
  format,
  height,
  svgContent,
  width,
}: {
  format: Exclude<DownloadFormat, "svg">;
  height: number;
  svgContent: string;
  width: number;
}) {
  const image = await loadSvgImage(svgContent);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const canvasWidth = Math.max(Math.ceil(width), 1);
  const canvasHeight = Math.max(Math.ceil(height), 1);

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  if (format === "jpg") {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Canvas conversion failed."));
      },
      format === "png" ? "image/png" : "image/jpeg",
      0.92,
    );
  });
}

function loadSvgImage(svgContent: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG image loading failed."));
    };
    image.src = url;
  });
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
      title: "병합용 텍스트 업로드",
      policy: "병합용 텍스트는 여러 개를 한 번에 선택할 수 있습니다.",
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

function createDomId(prefix: string, label: string) {
  const hash = Array.from(label).reduce(
    (accumulator, character) =>
      (accumulator * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );

  return `${prefix}-${hash.toString(36)}`;
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

function formatDimension(value: number) {
  return Number(value.toFixed(1)).toString();
}

function findLastSelectedIcon<TIcon extends { id: string }>(
  icons: TIcon[],
  selectedIds: string[],
) {
  const lastSelectedId = selectedIds.at(-1);

  if (!lastSelectedId) {
    return null;
  }

  return icons.find((icon) => icon.id === lastSelectedId) ?? null;
}

function getTextCardWidth(icon: WorkspaceIcon) {
  const ratio = icon.width / icon.height;

  return clamp(Math.round(64 * ratio + 24), 104, 176);
}

function getMobileTextCardWidth(icon: WorkspaceIcon) {
  return Math.round(getTextCardWidth(icon) * 0.6);
}

function isClientSvgFile(file: File) {
  return file.name.toLowerCase().endsWith(".svg") && file.type === "image/svg+xml";
}

function isResourceIconType(type: IconTypeValue): type is ResourceIconType {
  return type === IconType.MERGE_ICON || type === IconType.MERGE_TEXT;
}

function getOppositeResourceType(type: IconTypeValue): ResourceIconType | null {
  if (type === IconType.MERGE_ICON) {
    return IconType.MERGE_TEXT;
  }

  if (type === IconType.MERGE_TEXT) {
    return IconType.MERGE_ICON;
  }

  return null;
}

