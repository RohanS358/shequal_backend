import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Passwordless student entry: a student is identified within a school by their
// class + roll number. On first entry they also provide their name and the
// account is auto-created.
export class StudentLoginDto {
  @ApiProperty({ description: 'The school the student belongs to' })
  @IsString()
  @IsNotEmpty()
  schoolId: string

  @ApiProperty({ example: '10', description: 'Class / grade label' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  className: string

  @ApiProperty({ example: '12', description: 'Class roll number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  rollNo: string

  @ApiPropertyOptional({ description: "Student's name (used on first entry to create the account)" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string
}
