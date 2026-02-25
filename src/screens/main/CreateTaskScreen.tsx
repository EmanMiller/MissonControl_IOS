import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createTask } from '../../store/thunks/taskThunks';
import { RootState, AppDispatch } from '../../store';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

const CreateTaskScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, agents } = useSelector((state: RootState) => ({
    isLoading: state.tasks.isLoading,
    agents: state.agents.agents,
  }));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedAgent: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      assignedAgent: formData.assignedAgent || undefined,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch(createTask(taskData)).unwrap();
      Alert.alert('Success', 'Task created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const renderAgentPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Assigned Agent (Optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.agentsList}>
          <TouchableOpacity
            style={[
              styles.agentOption,
              !formData.assignedAgent && styles.agentOptionSelected,
            ]}
            onPress={() => handleInputChange('assignedAgent', '')}
          >
            <Text style={[
              styles.agentOptionText,
              !formData.assignedAgent && styles.agentOptionTextSelected,
            ]}>
              Unassigned
            </Text>
          </TouchableOpacity>
          
          {agents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.agentOption,
                formData.assignedAgent === agent.name && styles.agentOptionSelected,
              ]}
              onPress={() => handleInputChange('assignedAgent', agent.name)}
            >
              <Text style={[
                styles.agentOptionText,
                formData.assignedAgent === agent.name && styles.agentOptionTextSelected,
              ]}>
                {agent.name}
              </Text>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(agent.status) }]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'busy': return colors.warning;
      case 'idle': return colors.primary;
      case 'offline': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Task</Text>
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              style={[
                styles.saveButton,
                (!formData.title.trim() || isLoading) && styles.saveButtonDisabled,
              ]}
            >
              <Text style={[
                styles.saveButtonText,
                (!formData.title.trim() || isLoading) && styles.saveButtonTextDisabled,
              ]}>
                {isLoading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter task title..."
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Provide detailed task description..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {renderAgentPicker()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: typography.title3,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.small,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  saveButtonTextDisabled: {
    color: colors.background,
  },
  form: {
    padding: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  agentsList: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  agentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  agentOptionText: {
    fontSize: typography.subhead,
    color: colors.text,
    marginRight: spacing.xs,
  },
  agentOptionTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});