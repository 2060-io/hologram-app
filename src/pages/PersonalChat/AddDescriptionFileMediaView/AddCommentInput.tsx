import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
} from 'react-native'

import { Text, Icon } from '@2060/components/common'
import { whiteColor, secondaryColor, primaryColor, IS_DEVICE_IOS } from '@2060/constants'
import { useDebouncedValue } from '@2060/hooks'

type AddCommentInputProps = {
  userName: string
  onSend(comment: string): void
}

const AddCommentInput: React.FC<AddCommentInputProps> = ({ userName, onSend }) => {
  const [textValue, setTextValue] = useState('')
  const debouncedValue = useDebouncedValue(textValue)
  const { t } = useTranslation()

  return (
    <KeyboardAvoidingView behavior="position" style={styles.containerKeyboard}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.containerComment}>
          <View style={styles.containerInput}>
            <TextInput
              value={textValue}
              onChangeText={setTextValue}
              placeholder={t('personalChat.addComment')}
              placeholderTextColor={whiteColor}
              style={styles.input}
              autoCorrect={false}
              autoComplete="name"
              autoCapitalize="sentences"
              contextMenuHidden={true}
              disableFullscreenUI={true}
              enablesReturnKeyAutomatically={true}
              inlineImageLeft="ic_notification"
              inlineImagePadding={50}
              keyboardAppearance="dark"
              selectionColor={secondaryColor}
              selectTextOnFocus={true}
            />
          </View>
          <View style={styles.containerSend}>
            <View style={styles.containerUserName}>
              <Text style={styles.textUserName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.containerIconSend}
              activeOpacity={0.6}
              onPress={() => onSend(debouncedValue)}
            >
              <Icon as="Ionicons" name="send" color={whiteColor} size={40} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const sizeIcon = 45
const styles = StyleSheet.create({
  containerComment: {
    flex: 1,
    height: 300,
    justifyContent: 'flex-end',
    paddingBottom: IS_DEVICE_IOS ? 10 : 30,
  },
  containerInput: {
    height: 50,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: primaryColor,
    borderRadius: 30,
    paddingHorizontal: 20,
    marginHorizontal: 10,
  },
  containerKeyboard: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  input: {
    height: '100%',
    width: '100%',
    color: whiteColor,
    fontFamily: 'SFPro-Medium',
    fontSize: 17,
  },
  containerSend: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 10,
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerUserName: {
    width: '50%',
    backgroundColor: '#000',
    borderRadius: 50,
    padding: 10,
  },
  textUserName: {
    color: whiteColor,
    fontSize: 16,
    fontFamily: 'SFPro-Medium',
  },
  containerIconSend: {
    width: sizeIcon,
    height: sizeIcon,
    display: 'flex',
    overflow: 'hidden',
    borderRadius: sizeIcon / 2,
    justifyContent: 'center',
    backgroundColor: primaryColor,
  },
})

export default AddCommentInput
