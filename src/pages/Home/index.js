import React, { useContext, useState, useEffect } from 'react';
import Header from '../../components/Header';
import HistoricoList from '../../components/HistoricoList';
import firebase from '../../services/firebaseConnection';
import { format, isPast } from 'date-fns'
import Icon from 'react-native-vector-icons/MaterialIcons'
import DatePicker from '../../components/DatePicker'

import { Background, Container, Nome, Saldo, Title, List, Area } from './styles'

import { AuthContext } from '../../contexts/auth';
import { Alert, Platform, TouchableOpacity } from 'react-native';

export default function Home() {
  const [historico, setHistorico] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [newDate, setNewDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const { user } = useContext(AuthContext);
  const uid = user && user.uid;

  useEffect(() => {
    async function loadList() {
      await firebase.database().ref('users').child(uid).on('value', (snapshot) => {
        setSaldo(snapshot.val().saldo);
      });

      await firebase.database()
        .ref('historico') //Pega o nó
        .child(uid) //Pega o child do nó (uid do usuário logado)
        .orderByChild('date') //Ordena pela data
        .equalTo(format(newDate, 'dd/MM/yy')) //Formata a data para encontrar
        .limitToLast(10) //Limita para os ulitmos 10 items
        .on('value', (snapshot) => { //Busca o valor a ser alterado
          setHistorico([]); //Limpa o vetor para não duplicar

          snapshot.forEach((childItem) => { //forEach para listar o histórico
            let list = { //Montagem da informação
              key: childItem.key,
              tipo: childItem.val().tipo,
              valor: childItem.val().valor,
              date: childItem.val().date,
            };
            setHistorico((oldArray) => [...oldArray, list].reverse()); //Setta o array
          })
        })
    }
    loadList(); //Execução da função recursivamente~
  }, [newDate])

  function handleDelete(data) {
    // Se a data já passou entra no if
    if (isPast(new Date(data.date))) {
      alert('Voce não pode excluir um registro antigo');
      return;
    }

    Alert.alert(
      'Atenção!',
      `Você deseja excluir ${data.tipo} - Valor: R$ ${data.valor}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Continuar',
          onPress: () => handleDeleteSuccess(data)
        }
      ]
    )
  }

  async function handleDeleteSuccess(data) {
    await firebase.database()
      .ref('historico')
      .child(uid)
      .child(data.key)
      .remove()
      .then(async () => {
        let saldoAtual = saldo;
        data.tipo === 'despesa'
          ? saldoAtual += parseFloat(data.valor)
          : saldoAtual -= parseFloat(data.valor);

        await firebase
          .database()
          .ref('users')
          .child(uid)
          .child('saldo')
          .set(saldoAtual);
      })
      .catch((error) => {
        console.log(error);
      })
  }

  function handleShowPicker() {
    setShow(true);
  }
  
  function handleClose() {

  }

  const onChange = (date) => {
    setShow(Platform.OS === 'ios');
    setNewDate(date);
  }
  
  return (
    <Background>
      <Header />
      <Container>
        <Nome>{user && user.nome}</Nome>
        <Saldo>R$ {saldo.toFixed(2)}</Saldo>
      </Container>

      <Area>
        <TouchableOpacity onPress={handleShowPicker} >
          <Icon name='event' color='#FFF' size={30} />
        </TouchableOpacity>
        <Title>Ultimas movimentações</Title>
      </Area>
      <List
        showsVerticalScrollIndicator={false}
        data={historico}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (<HistoricoList data={item} deleteItem={handleDelete} />)}
      />
      
      {show && (
        <DatePicker 
        onClose={handleClose}
        date={newDate}
        onChange={onChange}
        />
      )}

    </Background>
  );
}