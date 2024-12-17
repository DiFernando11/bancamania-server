import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FirebaseApp, initializeApp } from 'firebase/app'
import {
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { CodeDocument, CodeDocumentResponse, CreateCode } from './types'

@Injectable()
export class FirebaseService {
  public app: FirebaseApp
  public firestore: Firestore
  private readonly logger = new Logger(FirebaseService.name)

  public codesCollection: CollectionReference

  constructor(private readonly configService: ConfigService) {
    this.app = initializeApp({
      apiKey: this.configService.get<string>('firebase.apiKey'),
      appId: this.configService.get<string>('firebase.appId'),
      authDomain: this.configService.get<string>('firebase.authDomain'),
      messagingSenderId: this.configService.get<string>(
        'firebase.messagingSenderId'
      ),
      projectId: this.configService.get<string>('firebase.projectId'),
      storageBucket: this.configService.get<string>('firebase.storageBucket'),
    })

    this.firestore = getFirestore(this.app)

    this._createCollections()
  }

  private _createCollections() {
    this.codesCollection = collection(this.firestore, 'codes')
  }

  // Método para guardar un nuevo "code"
  public async createCode({ data, feature }: CreateCode) {
    try {
      const docRef: DocumentReference = doc(this.codesCollection)
      const currentDate = new Date()
      const createdAt = Timestamp.fromDate(currentDate)
      const verificationExpiresAt = Timestamp.fromMillis(
        createdAt.toMillis() + 5 * 60 * 1000
      )
      const code = uuidv4().slice(0, 6)
      await setDoc(docRef, {
        ...data,
        code,
        createdAt: serverTimestamp(),
        expireAt: verificationExpiresAt,
        feature,
      })

      return code
    } catch (error) {
      console.error(error, 'Error al crear el codigo')
      throw new BadRequestException('Error al crear el codigo')
    }
  }

  public async isExpiredToken(data) {
    const expirationDate = new Date(
      data?.expireAt?.seconds * 1000 + data?.expireAt?.nanoseconds / 1000000
    )

    if (new Date() > expirationDate) {
      throw new BadRequestException(
        'Su codigo expiro, por favor intentelo de nuevo'
      )
    }
  }

  public async searchCode(q: any): Promise<CodeDocumentResponse> {
    const querySnapshot: QuerySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      throw new BadRequestException(
        'No tienes un codigo vigente selecionado intentalo de nuevo'
      )
    }

    const lastDoc: QueryDocumentSnapshot = querySnapshot.docs[0]
    const data = lastDoc.data() as CodeDocument
    const dataCode = { id: lastDoc.id, ...data }
    await this.isExpiredToken(dataCode)

    return dataCode
  }

  public async getCodeByEmailAndFeature({
    email,
    feature,
  }: {
    email: string
    feature: string
  }): Promise<CodeDocumentResponse> {
    const q = query(
      this.codesCollection,
      where('email', '==', email),
      where('feature', '==', feature),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    return this.searchCode(q)
  }

  public async getCodeByPhoneAndFeature({
    phone,
    feature,
  }: {
    phone: string
    feature: string
  }): Promise<CodeDocumentResponse> {
    const q = query(
      this.codesCollection,
      where('phone', '==', phone),
      where('feature', '==', feature),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    return this.searchCode(q)
  }

  public async deleteCodeById(id: string): Promise<void> {
    try {
      const docRef: DocumentReference = doc(this.codesCollection, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(error)
      throw new BadRequestException('Error al borrar el código')
    }
  }

  public async updateCodeExpireById(
    id: string,
    timeMinutes: number,
    data: any
  ): Promise<void> {
    try {
      const docRef: DocumentReference = doc(this.codesCollection, id)

      const verificationExpiresAt = new Date(
        Date.now() + timeMinutes * 60 * 1000
      )

      await updateDoc(docRef, {
        ...data,
        expireAt: verificationExpiresAt,
      })
    } catch (error) {
      console.error(error)
      throw new BadRequestException('Error al actualizar el código')
    }
  }

  public async deleteNonExpiredCodes(): Promise<void> {
    try {
      const newDate = Timestamp.fromDate(new Date())

      const nonExpiredQuery = query(
        this.codesCollection,
        where('expireAt', '<=', newDate)
      )

      const querySnapshot: QuerySnapshot = await getDocs(nonExpiredQuery)

      if (querySnapshot.empty) {
        this.logger.log('No hay códigos no expirados para eliminar.')

        return
      }

      const deletePromises = querySnapshot.docs.map(
        (docSnap: QueryDocumentSnapshot) => deleteDoc(docSnap.ref)
      )

      await Promise.all(deletePromises)

      this.logger.log(`${querySnapshot.size} códigos no expirados eliminados.`)
    } catch (error) {
      this.logger.error('Error al eliminar códigos no expirados', error)
      throw new BadRequestException('Error al eliminar códigos no expirados.')
    }
  }
}
