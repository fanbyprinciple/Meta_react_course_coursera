import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';



export default function TaskInput (){
    const [task, setTask] = useState('')

    const [tasks, setTasks] = useState([])

    return (
        <View style={styles.container}>
            <TextInput style={styles.textInput} placeholder='Enter your first task' 
            value={task} onChangeText={setTask}></TextInput>
        </View>
    )

}


const styles = StyleSheet.create({
    container: {

    }, 
    textInput: {

    },
});