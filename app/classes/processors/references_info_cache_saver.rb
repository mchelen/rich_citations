# Add sections node

module Processors
  class ReferencesInfoCacheSaver < Base
    include Helpers

    def process
      save_info_to_cache if Rails.configuration.app.use_cached_info
    end

    # Make sure we save the cache as the last thing
    def self.priority
      1000
    end

    def self.dependencies
      [ ] # References, ReferencesIdentifier, ReferencesAbstract, ReferencesDelayedLicense ]
    end

    protected

    def save_info_to_cache
      references.each do |id, ref|
        next unless ref[:doi] && ref[:info]

        PaperInfoCache.update('doi', ref[:doi], ref[:info])
      end
    end

  end
end