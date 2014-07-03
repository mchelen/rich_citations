# Used if no other resolvers succeed

module IdentifierResolvers
  class Fail < Base

    def resolve
      unresolved_references.each do |id, node|
        if ! root.results[id]

          info = {
              text:  node.text,
              score: nil,
          }

          set_result(id, info )
        end
      end
    end

  end
end