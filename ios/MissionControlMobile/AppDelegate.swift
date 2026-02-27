import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import LocalAuthentication
import Security

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "MissionControlMobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

@objc(KeychainModule)
class KeychainModule: NSObject, RCTBridgeModule {
  private let service = "com.missioncontrolmobile.secure"

  @objc
  static func moduleName() -> String! {
    return "KeychainModule"
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(setItem:value:resolver:rejecter:)
  func setItem(
    _ key: String,
    value: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let data = value.data(using: .utf8) else {
      reject("encoding_error", "Could not encode value.", nil)
      return
    }

    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key
    ]

    SecItemDelete(query as CFDictionary)

    var attributes = query
    attributes[kSecValueData as String] = data
    attributes[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly

    let status = SecItemAdd(attributes as CFDictionary, nil)
    if status == errSecSuccess {
      resolve(true)
    } else {
      reject("keychain_write_error", "Failed to save item to Keychain.", nil)
    }
  }

  @objc(getItem:resolver:rejecter:)
  func getItem(
    _ key: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    if status == errSecSuccess,
       let data = result as? Data,
       let value = String(data: data, encoding: .utf8) {
      resolve(value)
      return
    }

    if status == errSecItemNotFound {
      resolve(NSNull())
      return
    }

    reject("keychain_read_error", "Failed to read item from Keychain.", nil)
  }

  @objc(removeItem:resolver:rejecter:)
  func removeItem(
    _ key: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key
    ]

    let status = SecItemDelete(query as CFDictionary)
    if status == errSecSuccess || status == errSecItemNotFound {
      resolve(true)
    } else {
      reject("keychain_remove_error", "Failed to remove item from Keychain.", nil)
    }
  }
}

@objc(BiometricModule)
class BiometricModule: NSObject, RCTBridgeModule {
  @objc
  static func moduleName() -> String! {
    return "BiometricModule"
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(isAvailable:rejecter:)
  func isAvailable(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let context = LAContext()
    var error: NSError?
    let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)

    var type = "unknown"
    if #available(iOS 11.0, *) {
      switch context.biometryType {
      case .faceID:
        type = "FaceID"
      case .touchID:
        type = "TouchID"
      default:
        type = "none"
      }
    }

    resolve([
      "available": available,
      "biometryType": type
    ])
  }

  @objc(authenticate:resolver:rejecter:)
  func authenticate(
    _ reason: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let context = LAContext()
    var error: NSError?
    let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    if !available {
      reject("biometric_unavailable", "Biometric authentication is unavailable.", error)
      return
    }

    context.evaluatePolicy(
      .deviceOwnerAuthenticationWithBiometrics,
      localizedReason: reason
    ) { success, authError in
      DispatchQueue.main.async {
        if success {
          resolve(["success": true])
        } else {
          reject("biometric_failed", "Biometric authentication failed.", authError)
        }
      }
    }
  }
}
