import { FolderGit2, Plus, Trash2, CheckCircle2, ExternalLink } from 'lucide-react'
import { ProfileSectionHeader, profileInputCls, profileTextareaCls } from './profileUi'
import { newId, type CandidateProject } from '../../data/candidateProfileData'

type Props = {
  projects: CandidateProject[]
  onChange: (projects: CandidateProject[]) => void
}

export function ProjectSection({ projects, onChange }: Props) {
  function update(id: string, patch: Partial<CandidateProject>) {
    onChange(projects.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function remove(id: string) {
    onChange(projects.filter((p) => p.id !== id))
  }

  function add() {
    onChange([
      ...projects,
      {
        id: newId('proj'),
        name: '',
        technologies: [],
        description: '',
        githubUrl: '',
        liveUrl: '',
        codeQuality: 0,
        architecture: 0,
        aiVerified: false,
      },
    ])
  }

  return (
    <div className="rounded-xl border border-[#2d2e3e] bg-[#161722]/80 p-5 backdrop-blur-sm space-y-4">
      <div className="space-y-3 border-b border-[#2d2e3e] pb-4">
        <ProfileSectionHeader
          icon={FolderGit2}
          title="Projects"
          desc="Verified projects prove your skills to recruiters"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              add()
            }}
            className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
          >
            <Plus size={12} />
            Add Project
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-[#2d2e3e] bg-[#0b0c14]/50 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <input
                className={`${profileInputCls} font-semibold`}
                value={project.name}
                onChange={(e) => update(project.id, { name: e.target.value })}
                placeholder="Project Name"
              />
              <button
                type="button"
                onClick={() => remove(project.id)}
                className="shrink-0 rounded-lg p-1.5 text-[#8b8ca8] hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <input
              className={profileInputCls}
              value={project.technologies.join(', ')}
              onChange={(e) =>
                update(project.id, {
                  technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })
              }
              placeholder="Technologies: Java, Spring Boot, React..."
            />

            <textarea
              className={profileTextareaCls}
              value={project.description}
              onChange={(e) => update(project.id, { description: e.target.value })}
              placeholder="Project description..."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={profileInputCls}
                value={project.githubUrl}
                onChange={(e) => update(project.id, { githubUrl: e.target.value })}
                placeholder="GitHub URL"
              />
              <input
                className={profileInputCls}
                value={project.liveUrl}
                onChange={(e) => update(project.id, { liveUrl: e.target.value })}
                placeholder="Live Demo URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-[#8b8ca8]">Code Quality %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={profileInputCls}
                  value={project.codeQuality || ''}
                  onChange={(e) => update(project.id, { codeQuality: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-[#8b8ca8]">Architecture %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={profileInputCls}
                  value={project.architecture || ''}
                  onChange={(e) => update(project.id, { architecture: Number(e.target.value) })}
                />
              </div>
            </div>

            {(project.codeQuality > 0 || project.aiVerified) && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                {project.codeQuality > 0 && (
                  <span className="text-xs text-emerald-300">Code Quality: {project.codeQuality}%</span>
                )}
                {project.architecture > 0 && (
                  <span className="text-xs text-emerald-300">Architecture: {project.architecture}%</span>
                )}
                {project.aiVerified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300">
                    <CheckCircle2 size={12} />
                    AI Verified
                  </span>
                )}
              </div>
            )}

            {(project.githubUrl || project.liveUrl) && (
              <div className="flex gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-violet-300 hover:underline"
                  >
                    <ExternalLink size={11} />
                    GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-violet-300 hover:underline"
                  >
                    <ExternalLink size={11} />
                    Live Demo
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
