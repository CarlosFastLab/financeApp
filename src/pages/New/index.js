import React, { useState, useContext } from 'react';
import { View, Text, SafeAreaView, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { format } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import firebase from '../../services/firebaseConnection'
import { Background, Input, SubmitButton, SubmitText } from './styles'
import { AuthContext } from '../../contexts/auth'

import Header from '../../components/Header'
import Picker from '../../components/Picker'

export default function New() {
  const { user: usuario } = useContext(AuthContext)
  const navigation = useNavigation();
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('receita');

  function handleSubmit() {
    Keyboard.dismiss();
    if(isNaN(parseFloat(valor)) || tipo === null) {
      alert('Preencha todos os campos!');
      return
    }

    Alert.alert(
      'Confirmando dados',
      `Tipo ${tipo} - Valor: ${parseFloat(valor)}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Continuar',
          onPress: () => handleAdd()
        }
      ]
    )
  }

  async function handleAdd() {
    //Aqui ele está pegando o uid do useContext!!!
    let uid = usuario.uid;

    let key = await (await firebase.database().ref('historico').child(uid).push()).key;
    await firebase.database().ref('historico').child(uid).child(key).set({
      tipo: tipo,
      valor: parseFloat(valor),
      date: format(new Date(), 'dd/MM/yy')
    })

    // Atualizar o saldo
    let user = firebase.database().ref('users').child(uid); //Acessando o usuário logado
    await user.once('value').then((snapshot) => {
      let saldo = parseFloat(snapshot.val().saldo);

      //Verificando se o valor é receita e despesa, adicionando ou diminuindo de acordo
      tipo === 'despesa' ? saldo -= parseFloat(valor) : saldo += parseFloat(valor); 

      //Settando valor do saldo atualizado no db
      user.child('saldo').set(saldo);
    });
    setValor('');
    Keyboard.dismiss();
    navigation.navigate('Home');
  }

  return (
    

    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <Background>
        <Header />

        <SafeAreaView style={{ alignItems: 'center' }}>
          <Input
            placeholder='Valor desejado'
            keyboardType='numeric'
            returnKeyType='next'
            onSubmitEditing={() => Keyboard.dismiss()}
            value={valor}
            onChangeText={(text) => setValor(text)}
          />

          <Picker onChange={setTipo} tipo={tipo} />

          <SubmitButton onPress={handleSubmit}>
            <SubmitText>Registrar</SubmitText>
          </SubmitButton>
        </SafeAreaView>
      </Background>
    </TouchableWithoutFeedback>
  );
}