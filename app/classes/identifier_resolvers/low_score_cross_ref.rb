# Fills in non-results with low-scoring results from crossref

module IdentifierResolvers
  class LowScoreCrossRef < Base

    def resolve
      crossref_infos = state[:crossref_infos]

      crossref_infos.each do |id, info|
        if ! has_result?(id)
          info[:ref_source] = :crossref_lowscore
          set_result(id, info)
        end
      end
    end

  end
end