module Processors
  class ReferencesCrossmark < Base
    include Helpers

    def process
      references_for_type(:doi).each do |ref|
        next if ref[:updated_by]

        doi = ref[:id]
        get_crossmark_info(doi, ref) if doi
      end
    end

    def self.dependencies
      ReferencesIdentifier
    end

    protected

    def get_crossmark_info(doi, ref)
      doi_enc = URI.encode_www_form_component(doi)
      result = Rails.cache.fetch("crossmark_#{doi_enc}", :expires_in=> 108000) do
        url = "http://crossmark.crossref.org/crossmark/?doi=#{doi_enc}"
        begin
          JSON.parse(HttpUtilities.get(url), symbolize_names:true)
        rescue Net::HTTPFatalError #@mro #@todo
          {}
        rescue Net::HTTPServerException => ex
          raise unless ex.response.is_a?(Net::HTTPNotFound)
        end
      end

      ref[:updated_by] = result[:updated_by]
    end
  end
end
