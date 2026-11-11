import type { CompanyProfileData } from '../../../data/recruiterCompanyProfileData'

type Props = {
  profile: CompanyProfileData
}

export function CompanyJobs({ profile }: Props) {
  return (
    <div className="rounded-2xl border border-[#2d2e3e]/80 bg-[#161722]/60 p-5 backdrop-blur-md">
      <h3 className="mb-4 text-sm font-semibold text-white">Active Jobs Overview</h3>
      <div className="space-y-3">
        {profile.jobOverviews.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-[#2d2e3e]/60 bg-[#0b0c14]/40 p-4"
          >
            <p className="font-semibold text-white">{job.title}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-[#8b8ca8]">Applicants</p>
                <p className="mt-0.5 font-bold text-white">{job.applicants}</p>
              </div>
              <div>
                <p className="text-[#8b8ca8]">Avg DevScore</p>
                <p className="mt-0.5 font-bold text-violet-300">{job.avgDevScore}</p>
              </div>
              <div>
                <p className="text-[#8b8ca8]">Top Match</p>
                <p className="mt-0.5 font-bold text-emerald-400">{job.topMatchPercent}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
