import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Plus,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore/useModalStore";
import { useClearStorage } from "@/hooks/clearStorage/useClearStorage";
import { useDeleteProject } from "@/hooks/useProject/useDeleteProject";
import { useAdminProject } from "@/hooks/useProject/useAdminProject";

import { ThemeToggle } from "@/components/themeToggle/ThemeToggle";

export const DashboardNavbar = () => {
  const { token } = useParams();

  const { data: project } = useAdminProject(token);
  const { mutate: deleteProject, isPending: isLoading } =
    useDeleteProject(token);

  const navigate = useNavigate();
  const { openModal, closeModal } = useModalStore();
  const { clearAppSession } = useClearStorage();

  const handleDeleteClick = () => {
    openModal("WARNING", {
      title: "Delete Project?",
      description:
        "This will permanently delete the files, the link, and all data. This action cannot be undone.",
      confirmText: "Delete Everything",
      variant: "danger",
      onConfirm: async () => {
        deleteProject();
        clearAppSession();
        navigate("/");
      },
    });
  };

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal("WARNING", {
      title: "Leave Page?",
      description:
        "Leaving this page will reset your current session data. Ensure you have the link saved if you want to return.",
      confirmText: "Leave & Reset",
      variant: "neutral",
      onConfirm: async () => {
        if (deleteProject) await deleteProject();
        clearAppSession();
        closeModal();
        navigate("/");
      },
    });
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* LEFT: Logo & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/"
            onClick={handleLeaveClick}
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900 dark:text-white hover:opacity-80 transition"
          >
            <div className="w-6 h-6 bg-zinc-900 text-white dark:bg-white dark:text-black rounded flex items-center justify-center">
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
            <span className="hidden sm:inline">Freelance Approval</span>
          </Link>

          {/* Divider */}
          <span className="hidden xs:block text-zinc-300 dark:text-zinc-700 h-4 border-r border-zinc-300 dark:border-zinc-700 transform rotate-12"></span>

          {/* Project Name */}
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-25 sm:max-w-xs">
            {isLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              project?.name || <span className="text-zinc-400 dark:text-zinc-500">Project</span>
            )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2">
          {/* 1. THEME TOGGLE */}
          <ThemeToggle />

          {/* 2. PUBLIC LINK */}
          {project && (
            <a
              href={`/view/${project.publicToken}`}
              target="_blank"
              rel="noreferrer"
              title="Public View"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition px-2 sm:px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Public View</span>
            </a>
          )}

          {/* Divider for actions */}
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

          {/* 3. DELETE BUTTON */}
          <button
            onClick={handleDeleteClick}
            title="Delete Project"
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 size={17} />
          </button>

          {/* 4. NEW PROJECT BUTTON */}
          <Link
            to="/"
            onClick={handleLeaveClick}
            className="flex items-center gap-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-black px-2.5 sm:px-3 py-2 rounded-lg dark:hover:bg-zinc-200 transition shadow-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
