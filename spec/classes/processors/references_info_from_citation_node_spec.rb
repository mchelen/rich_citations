require 'spec_helper'

describe Processors::ReferencesInfoFromCitationNode do
  include Spec::ProcessorHelper

  it "should extract info fields from the reference node" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation publication-type="journal" xlink:type="simple">
          <name name-style="western"><surname>Davenport</surname><given-names>E</given-names></name>,
          <name name-style="western"><surname>Snyder</surname><given-names>H</given-names></name>
          (<year>1995</year>)
          <article-title>Who cites women? Whom do women cite? An exploration of gender and scholarly citation in sociology</article-title>.
          <source>J Doc</source> <volume>51</volume>: <fpage>404</fpage>–<lpage>410</lpage>.
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
      node: ref_node,
      info: {},
    } } )

    expect(result[:references]['ref-1'][:info]).to eq( :"container-type" => "journal",
                                                       :"container-title"=> "J Doc",
                                                       :title            => 'Who cites women? Whom do women cite? An exploration of gender and scholarly citation in sociology',
                                                       :volume           => "51",
                                                       :issued           => {:"date-parts"=>[[1995]]},
                                                       :page             =>"404-410",
                                                       :author           =>
                                                           [{:family=>"Davenport", :given=>"E"},
                                                            {:family=>"Snyder",    :given=>"H"}]                )
  end

  it "should extract only a start page" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation publication-type="journal" xlink:type="simple">
          <fpage>404</fpage>.
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
        node: ref_node,
        info: {},
    } } )

    expect(result[:references]['ref-1'][:info][:page]).to eq('404-404')
  end

  it "should extract a start and end page" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation publication-type="journal" xlink:type="simple">
          <fpage>404</fpage>-<lpage>410</lpage>.
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
        node: ref_node,
        info: {},
    } } )

    expect(result[:references]['ref-1'][:info][:page]).to eq('404-410')
  end

  it "should not overwrite existing fields" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation publication-type="journal" xlink:type="simple">
          <name name-style="western"><surname>Davenport</surname><given-names>E</given-names></name>,
          <name name-style="western"><surname>Snyder</surname><given-names>H</given-names></name>
          (<year>1995</year>)
          <article-title>Who cites women? Whom do women cite? An exploration of gender and scholarly citation in sociology</article-title>.
          <source>J Doc</source> <volume>51</volume>: <fpage>404</fpage>–<lpage>410</lpage>.
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
        node: ref_node,
        info: {
            :"container-type" => "paper",
            :"container-title"=> "Container Title",
            :title            => 'Article Title',
            :volume           => "99",
            :issued           => {:"date-parts"=>[[2001,1,1]] },
            :page             =>"100-101",
            :author           =>
                 [{:family=>"Roberts", :given=>"J"},
                  {:family=>"Jolie",   :given=>"J"} ]

    } } } )

    expect(result[:references]['ref-1'][:info]).to eq( :"container-type" => "paper",
                                                       :"container-title"=> "Container Title",
                                                       :title            => 'Article Title',
                                                       :volume           => "99",
                                                       :issued           => {:"date-parts"=>[[2001,1,1]] },
                                                       :page             =>"100-101",
                                                       :author           =>
                                                           [{:family=>"Roberts", :given=>"J"},
                                                            {:family=>"Jolie",   :given=>"J"}]                )
  end

  it "should not add null info fields" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation xlink:type="simple">
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
        node: ref_node,
        info: {},
    } } )

    expect(result[:references]['ref-1'][:info]).to eq( { } )
  end

  it "should not add blank info fields" do
    ref_node = Nokogiri::XML.parse <<-XML
      <ref id="pbio.1001675-Davenport1"><label>17</label>
        <mixed-citation publication-type="" xlink:type="simple">
          <article-title></article-title>.
          <source></source> <volume></volume>
        </mixed-citation>
      </ref>
    XML

    process( references: { 'ref-1' => {
        node: ref_node,
        info: {},
    } } )

    expect(result[:references]['ref-1'][:info]).to eq( { } )
  end

end
