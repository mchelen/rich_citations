# coding: utf-8
require "spec_helper"

describe PapersController do
  describe "GET '/view/10.1371/journal.pone.0067380'" do
    it "returns http success" do
      get 'view', id: '10.1371/journal.pone.0067380'
      expect(response).to be_success
    end
  end
  
  describe "GET '/view/10.1371/journal.pone.0067380/references/1'" do
    it "returns http success" do
      get :reference, id: '10.1371/journal.pone.0067380', referenceid: '2'
      expect(response).to be_success
      parsed = JSON.parse(response.body)
      expect(parsed["info"]["author"]).to eq([{"family"=>"Similä", "given"=>"Tiu"}, {"family"=>"Ugarte", "given"=>"Fernando"}])
    end
  end
end