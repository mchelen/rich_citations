module Plos
  class PaperDatabase

    attr_reader :results

    def self.analyze!(search_query, limit=500)
      Rails.logger.info("Searching for #{search_query.inspect}")
      matching = Plos::Api.search(search_query, query_type:"subject", rows:limit)
      Rails.logger.info("Found #{matching.count} results")
      matching_dois = matching.map { |r| r['id'] }

      database = self.new

      matching_dois.each do |doi|
        Rails.logger.info("Fetching #{doi} ...")
        xml = Plos::Api.document( doi )
        Rails.logger.info("Parsing #{doi} ...")
        parser = Plos::PaperParser.new(xml)
        database.add_paper(doi, parser.paper_info)
      end

      Rails.logger.info("Completed Analysis")
      database.results
    end

    def initialize
      @results = {
          match_count: 0,
          matches:     [],
      }
    end

    def add_paper(paper_doi, paper_info)
      # Rails.logger.debug(citing_info.inspect)
      add_references(paper_doi, paper_info, paper_info[:references])
    end

    def results
      if @recalculate

        @results[:citations].each do |doi, info|
          recalculate_results(info)
        end

        @recalculate = false
      end

      @results
    end

    private

    def add_references(citing_doi, paper_info, all_references)
      @results[:match_count] += 1
      @results[:matches] << citing_doi

      @results[:citations] ||= {}

      all_references.each do |cited_num, cited_ref|
        cited_num = cited_num.to_s.to_i
        cited_doi = cited_ref[:doi]
        next unless cited_doi

        cited_info = cited_doi_info(cited_doi)

        # cited_info[:id]                 ||= id
        cited_info[:citations]            += 1
        cited_info[:intra_paper_mentions] += cited_ref[:citation_count].to_i

        citing_info = new_citing_info(cited_ref)
        cited_info[:citing_papers][citing_doi] = citing_info

        if cited_ref[:zero_mentions]
          cited_info[:zero_mentions] ||= []
          cited_info[:zero_mentions] << citing_doi
        end

        groups = cited_ref[:citation_groups]
        if groups
          add_co_citation_counts(cited_num, groups, cited_info, all_references)
          add_citing_word_counts(groups, citing_info, paper_info[:paper][:word_count] )
          add_section_summaries(groups, cited_info)
        end
      end

      @recalculate = true
    end

    def cited_doi_info(doi)
      @results[:citations][ doi ] ||= {
        intra_paper_mentions: 0,
        citations:            0,
        citing_papers:        {},
        sections:             {},
        co_citation_counts:   {},
      }
    end

    def new_citing_info(ref)
      info = {
          word_positions: [],
          citation_count: ref[:citation_count].to_i,
          median_co_citations: ref[:median_co_citations].to_i,
      }
      info[:zero_mentions] = true if ref[:zero_mentions]

      info
    end

    def add_citing_word_counts(groups, citing_info, paper_word_count)
      positions = citing_info[:word_positions]

      groups.each do |group|
        positions << "#{group[:word_count]}/#{paper_word_count}"
      end
    end

    def add_section_summaries(groups, cited_info)
      sections  = cited_info[:sections]

      groups.each do |group|
        # Aggregate section counts
        section = group[:section]
        sections[section] = sections[section].to_s.to_i + 1
      end
    end

    def add_co_citation_counts(cited_num, groups, cited_info, all_references)
      co_citation_counts = cited_info[:co_citation_counts]

      groups.each do |group|

        # Aggregate co-citation counts
        group[:references].each do |co_citation_num|
          next if co_citation_num == cited_num

          cc_ref = all_references[co_citation_num] || all_references[co_citation_num.to_s.to_sym]
          co_citation_doi = cc_ref[:doi] || 'No-DOI'
          co_citation_counts[co_citation_doi] = co_citation_counts[co_citation_doi].to_i + 1
        end

      end
    end

    def recalculate_results(info)
      ipms = info[:citing_papers].map { |doi, p| p[:intra_paper_mentions]}
      info[:median_ipms]  = ipms.median

      miccs = info[:citing_papers].map { |doi, p| p[:median_co_citations]}
      info[:median_miccs] = miccs.median
    end

  end
end