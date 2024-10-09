import type { MRZProperties } from './utils/mrzProperties'

import React, { FC, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useCameraDevices } from 'react-native-vision-camera'

import MRZCamera from './MRZCamera'
import { parseMRZ } from './utils/mrzParser'
import { MRZScannerProps } from './utils/types'

const MRZScanner: FC<PropsWithChildren<MRZScannerProps>> = ({ onMRZFinalResults, onSkipPressed }) => {
  const numQAChecks = 3
  const devices = useCameraDevices()
  const device = devices.find(dev => dev.position === 'back')
  const [isActive, setIsActive] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scanSuccessAux = useRef(false)
  const [docMRZQAList, setDocMRZQAList] = useState<(string | undefined)[]>([])
  const [docTypeQAList, setDocTypeQAList] = useState<(string | undefined)[]>([])
  const [issuingCountryQAList, setIssuingCountryQAList] = useState<(string | undefined)[]>([])
  const [givenNamesQAList, setGivenNamesQAList] = useState<(string | undefined)[]>([])
  const [lastNamesQAList, setLastNamesQAList] = useState<(string | undefined)[]>([])
  const [idNumberQAList, setIdNumberQAList] = useState<(string | undefined)[]>([])
  const [nationalityQAList, setNationalityQAList] = useState<(string | undefined)[]>([])
  const [dobQAList, setDobQAList] = useState<(string | undefined)[]>([])
  const [genderQAList, setGenderQAList] = useState<(string | undefined)[]>([])
  const [docExpirationDateQAList, setDocExpirationDateQAList] = useState<(string | undefined)[]>([])
  const [additionalInformationQAList, setAdditionalInformationQAList] = useState<(string | undefined)[]>([])

  useEffect(() => {
    return () => {
      setIsActive(false)
    }
  }, [])

  /**
   * If all elements in list match element, add the new element.
   * If not, empty the list, then add the new element to the list.
   * @param list
   * @param element
   */
  const mrzQACheck = (list: (string | undefined)[], element?: string) => {
    let newList = [...list]
    for (let i = 0; i < list.length; i++) {
      if (list[i] !== element) {
        newList = []
      }
    }
    newList.push(element)
    return newList
  }

  /**
   * Returns true if all QALists are full (their sizes are >= numberOfPreviousMRZsToCompareTo).
   * If one or more of them are not full, it updates them with the most recently captured
   * field that pertains to them.
   * @param numOfQAChecks
   * @param mrzResults
   */
  const allQAListAreFull = (numOfQAChecks: number, mrzResults: MRZProperties) => {
    if (
      docMRZQAList.length >= 1 &&
      docTypeQAList.length >= numOfQAChecks &&
      issuingCountryQAList.length >= numOfQAChecks &&
      givenNamesQAList.length >= numOfQAChecks &&
      lastNamesQAList.length >= numOfQAChecks &&
      idNumberQAList.length >= numOfQAChecks &&
      nationalityQAList.length >= numOfQAChecks &&
      dobQAList.length >= numOfQAChecks &&
      genderQAList.length >= numOfQAChecks &&
      docExpirationDateQAList.length >= numOfQAChecks &&
      issuingCountryQAList.length >= numOfQAChecks
    ) {
      return true
    }
    if (givenNamesQAList.length < numOfQAChecks) {
      setGivenNamesQAList(mrzQACheck(givenNamesQAList, mrzResults.givenNames))
    }
    if (lastNamesQAList.length < numOfQAChecks) {
      setLastNamesQAList(mrzQACheck(lastNamesQAList, mrzResults.lastNames))
    }
    if (idNumberQAList.length < numOfQAChecks) {
      setIdNumberQAList(mrzQACheck(idNumberQAList, mrzResults.idNumber))
    }
    if (nationalityQAList.length < numOfQAChecks) {
      setNationalityQAList(mrzQACheck(nationalityQAList, mrzResults.nationality))
    }
    if (dobQAList.length < numOfQAChecks) {
      setDobQAList(mrzQACheck(dobQAList, mrzResults.dob))
    }
    if (genderQAList.length < numOfQAChecks) {
      setGenderQAList(mrzQACheck(genderQAList, mrzResults.gender))
    }
    if (issuingCountryQAList.length < numOfQAChecks) {
      setIssuingCountryQAList(mrzQACheck(issuingCountryQAList, mrzResults.issuingCountry))
    }
    if (docTypeQAList.length < numOfQAChecks) {
      setDocTypeQAList(mrzQACheck(docTypeQAList, mrzResults.docType))
    }
    if (docExpirationDateQAList.length < numOfQAChecks) {
      setDocExpirationDateQAList(mrzQACheck(docExpirationDateQAList, mrzResults.docExpirationDate))
    }
    if (additionalInformationQAList.length < numOfQAChecks) {
      setAdditionalInformationQAList(
        mrzQACheck(additionalInformationQAList, mrzResults.additionalInformation),
      )
    }
    if (docMRZQAList.length < 1) {
      setDocMRZQAList(mrzQACheck(docMRZQAList, mrzResults.docMRZ))
    }
    return false
  }

  const statusCheck = (completedQAChecks: number, numOfChecks = numQAChecks) => {
    if (completedQAChecks === numOfChecks) {
      return 'rgba(53,94,59,1.0)'
    } else {
      return 'white'
    }
  }

  const styles = StyleSheet.create({
    feedbackContainer: {
      position: 'absolute',
      top: 55,
      alignItems: 'flex-start',
      backgroundColor: 'rgba(200,200,200,0.8)',
      width: '100%',
      textAlignVertical: 'center',
    },
    feedbackText: {
      color: 'white',
      fontSize: 10,
      textAlign: 'center',
      width: '33.3%',
      paddingTop: 10,
      textAlignVertical: 'center',
      height: '100%',
    },
    flexRow: { flexDirection: 'row' },
    givenNamesQAList: {
      color: statusCheck(givenNamesQAList.length),
    },
    lastNamesQAList: {
      color: statusCheck(lastNamesQAList.length),
    },
    dobQAList: {
      color: statusCheck(dobQAList.length),
    },
    nationalityQAList: {
      color: statusCheck(nationalityQAList.length),
    },
    idNumberQAList: {
      color: statusCheck(idNumberQAList.length),
    },
    issuingCountryQAList: {
      color: statusCheck(issuingCountryQAList.length),
    },
    docExpirationDateQAList: {
      color: statusCheck(docExpirationDateQAList.length),
    },
    additionalInformationQAList: {
      color: statusCheck(additionalInformationQAList.length),
    },
    docMRZQAList: {
      color: statusCheck(docMRZQAList.length, 1),
    },
    genderQAList: {
      color: statusCheck(genderQAList.length),
      paddingBottom: 10,
    },
    docTypeQAList: {
      color: statusCheck(docTypeQAList.length),
      paddingBottom: 10,
    },
  })

  const skipScan = () => {
    setIsActive(false)
    onSkipPressed()
  }

  const onData = (lines: string[]) => {
    const mrzResults = parseMRZ(lines)
    if (mrzResults) {
      if (allQAListAreFull(numQAChecks, mrzResults) && !scanSuccessAux.current) {
        scanSuccessAux.current = true
        setScanSuccess(true)
        setIsActive(false)
        onMRZFinalResults(mrzResults)
      }
    }
  }

  return (
    <View testID="scanDocumentView" style={StyleSheet.absoluteFill}>
      {device && isActive ? (
        <MRZCamera
          onData={onData}
          scanSuccess={scanSuccess}
          onSkipPressed={skipScan}
          cameraProps={{ device, isActive }}
        />
      ) : undefined}

      <View style={[styles.feedbackContainer]}>
        <View style={styles.flexRow}>
          <Text style={[styles.feedbackText, styles.givenNamesQAList]}>
            {`Given name ${givenNamesQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.lastNamesQAList]}>
            {`Last name ${lastNamesQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.dobQAList]}>
            {`DOB ${dobQAList.length} / ${numQAChecks}`}
          </Text>
        </View>
        <View style={styles.flexRow}>
          <Text style={[styles.feedbackText, styles.nationalityQAList]}>
            {`Nationality ${nationalityQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.idNumberQAList]}>
            {`ID Number ${idNumberQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.issuingCountryQAList]}>
            {`Issuing Country ${issuingCountryQAList.length} / ${numQAChecks}`}
          </Text>
        </View>
        <View style={styles.flexRow}>
          <Text style={[styles.feedbackText, styles.docExpirationDateQAList]}>
            {`Expiration Date ${docExpirationDateQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.additionalInformationQAList]}>
            {`Additional Info ${additionalInformationQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.docMRZQAList]}>
            {`DocMRZ ${docMRZQAList.length} / ${1}`}
          </Text>
        </View>
        <View style={styles.flexRow}>
          <Text style={[styles.feedbackText, styles.genderQAList]}>
            {`Gender ${genderQAList.length} / ${numQAChecks}`}
          </Text>
          <Text style={[styles.feedbackText, styles.docTypeQAList]}>
            {`DocType ${docTypeQAList.length} / ${numQAChecks}`}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default MRZScanner
