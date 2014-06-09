require 'spec_helper'

class A
  def aaa; puts "original"; end
end

describe Processors::ReferencesDelayedLicense do
  include Spec::ProcessorHelper

  before do
    refs 'First', 'Second'
    allow(IdentifierResolver).to receive(:resolve).and_return('ref-1' => { doi:'10.111/111' }, 'ref-2' => { doi:'10.222/222' } )
  end

  def stub_clock(difference)
    start = Time.new(2001,1,1, 12,00, 00)
    expect_any_instance_of(Processors::ReferencesDelayedLicense).to receive(:timestamp).and_return(start+difference)
    expect_any_instance_of(Processors::ReferencesLicense).to receive(:timestamp).and_return(start)
  end

  def make_license(doi, type, status='active', date=Time.now)
    {
        identifier:[
                       {type:'doi', id:doi}
                   ],
        license:[{status:status,
                  type:type,
                  provenance:{date:date.as_json}
                 }]
    }
  end

  it "should only call the API for unmatched licenses" do
    first_licenses = { results: [make_license('10.222/222', 'test-license-2') ]}.to_json
    expect(Plos::Api).to receive(:http_post).ordered.and_return(first_licenses)

    expected_data = [{"type"=>"doi","id"=>"10.111/111"}].to_json
    expect(Plos::Api).to receive(:http_post).with('http://howopenisit.org/lookup/12345,67890', expected_data, anything).ordered.and_return('{}')

    stub_clock(20.seconds)

    process
  end

  it "should not call the API twice if all licenses were matched on the first call" do
    first_licenses = { results: [make_license('10.222/222', 'test-license-2'), make_license('10.111/111', 'test-license-1') ]}.to_json
    expect(Plos::Api).to receive(:http_post).once.and_return(first_licenses)

    process
  end

  it "should set licenses from the second run" do
    first_licenses = { results: [make_license('10.111/111', 'test-license-1') ]}.to_json
    expect(Plos::Api).to receive(:http_post).ordered.and_return(first_licenses)

    second_licenses = { results: [make_license('10.222/222', 'test-license-2') ]}.to_json
    expect(Plos::Api).to receive(:http_post).ordered.and_return(second_licenses)

    stub_clock(20.seconds)

    expect( result[:references]['ref-1'][:info][:license] ).to eq('test-license-1')
    expect( result[:references]['ref-2'][:info][:license] ).to eq('test-license-2')
  end

  it "should sleep if necessary" do
    first_licenses = { results: [make_license('10.111/111', 'test-license-1') ]}.to_json
    second_licenses = { results: [make_license('10.222/222', 'test-license-2') ]}.to_json
    allow(Plos::Api).to receive(:http_post).and_return(first_licenses, second_licenses)

    stub_clock(0.5.seconds)
    expect_any_instance_of(Processors::ReferencesDelayedLicense).to receive(:sleep).with(1.5)

    process
  end

  it "should not sleep if enough time has already passed" do
    first_licenses = { results: [make_license('10.111/111', 'test-license-1') ]}.to_json
    second_licenses = { results: [make_license('10.222/222', 'test-license-2') ]}.to_json
    allow(Plos::Api).to receive(:http_post).and_return(first_licenses, second_licenses)

    stub_clock(2.seconds)
    expect_any_instance_of(Processors::ReferencesDelayedLicense).not_to receive(:sleep)

    process
  end

end