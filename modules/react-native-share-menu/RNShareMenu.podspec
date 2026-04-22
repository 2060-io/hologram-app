require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNShareMenu"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => ".git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"
  # ShareViewController is embedded directly into the host app's Share Extension
  # target (not into this pod), so it must be excluded from the library build.
  s.exclude_files = [
    "ios/ShareViewController.swift"
  ]

  install_modules_dependencies(s)
end
